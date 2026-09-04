/**
 * LLM Integration Service (Gemini & OpenAI)
 * Provides unified, production-grade LLM routing with tool/function calling
 * and graceful fallback to offline engines when no API key is provided.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

export interface LlmToolCall {
  name: string;
  args: Record<string, any>;
}

export interface LlmGenerationResult {
  text?: string;
  toolCalls?: LlmToolCall[];
  provider: 'gemini' | 'openai' | 'none';
}

/**
 * Checks if a real LLM API key is configured in environment
 */
export function isLlmConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
}

/**
 * Returns active provider name or 'none'
 */
export function getActiveLlmProvider(): 'gemini' | 'openai' | 'none' {
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'none';
}

/**
 * Generates chat completion with tool calling support
 */
export async function callLlmChat({
  systemPrompt,
  messages,
  tools,
}: {
  systemPrompt: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  tools?: ToolDefinition[];
}): Promise<LlmGenerationResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // 1. Google Gemini Provider
  if (geminiKey) {
    try {
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const body: any = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1000,
        },
      };

      if (tools && tools.length > 0) {
        body.tools = [
          {
            functionDeclarations: tools.map(t => ({
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            })),
          },
        ];
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || `Gemini API error ${res.status}`);
      }

      const candidate = data.candidates?.[0]?.content;
      if (!candidate) {
        return { text: '', provider: 'gemini' };
      }

      const toolCalls: LlmToolCall[] = [];
      let text = '';

      for (const part of candidate.parts || []) {
        if (part.text) text += part.text;
        if (part.functionCall) {
          toolCalls.push({
            name: part.functionCall.name,
            args: part.functionCall.args || {},
          });
        }
      }

      return { text: text.trim(), toolCalls: toolCalls.length > 0 ? toolCalls : undefined, provider: 'gemini' };
    } catch (err: any) {
      console.warn('⚠️ [LLM ERROR - GEMINI]:', err.message, '— falling back to built-in offline engine');
      return { provider: 'none' };
    }
  }

  // 2. OpenAI Provider
  if (openaiKey) {
    try {
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const url = 'https://api.openai.com/v1/chat/completions';

      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ];

      const body: any = {
        model,
        messages: formattedMessages,
        temperature: 0.4,
        max_tokens: 1000,
      };

      if (tools && tools.length > 0) {
        body.tools = tools.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }));
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || `OpenAI API error ${res.status}`);
      }

      const choice = data.choices?.[0]?.message;
      if (!choice) return { text: '', provider: 'openai' };

      const toolCalls: LlmToolCall[] = [];
      if (choice.tool_calls) {
        for (const tc of choice.tool_calls) {
          try {
            toolCalls.push({
              name: tc.function.name,
              args: JSON.parse(tc.function.arguments || '{}'),
            });
          } catch {}
        }
      }

      return {
        text: choice.content || '',
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        provider: 'openai',
      };
    } catch (err: any) {
      console.warn('⚠️ [LLM ERROR - OPENAI]:', err.message, '— falling back to built-in offline engine');
      return { provider: 'none' };
    }
  }

  return { provider: 'none' };
}

/**
 * Generates single-turn text completion with structured guidance
 */
export async function generateLlmText({
  systemPrompt,
  prompt,
  temperature = 0.5,
}: {
  systemPrompt: string;
  prompt: string;
  temperature?: number;
}): Promise<string | null> {
  const res = await callLlmChat({
    systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });

  return res.text || null;
}
