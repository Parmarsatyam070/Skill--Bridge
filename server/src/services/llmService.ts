/**
 * LLM Integration Service (Google Gemini & OpenAI)
 * Provides unified, production-grade LLM routing using the official Google Gen AI SDK (@google/genai),
 * OpenAI fallback, transparent error classification, and graceful fallback to offline engines.
 */

import { GoogleGenAI } from '@google/genai';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
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

export type LlmErrorCategory =
  | 'INVALID_API_KEY'
  | 'UNSUPPORTED_MODEL'
  | 'QUOTA_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface ClassifiedLlmError {
  type: LlmErrorCategory;
  provider: 'gemini' | 'openai';
  status?: number;
  message: string;
  userGuidance: string;
}

// Redact any actual keys if they appear in an error string
function redactKey(message: string, keys: (string | undefined)[]): string {
  let sanitized = message;
  for (const k of keys) {
    if (k && k.length > 5) {
      sanitized = sanitized.split(k).join('[REDACTED_API_KEY]');
    }
  }
  return sanitized;
}

/**
 * Classifies Google Gemini API errors for clear terminal diagnostics
 */
export function classifyGeminiError(err: any): ClassifiedLlmError {
  const status = err.status || err.statusCode || (err.response && err.response.status);
  const rawMsg = err.message || String(err);

  // 1. Invalid API Key
  if (
    status === 400 && (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('API key not valid') || rawMsg.includes('INVALID_ARGUMENT')) ||
    status === 403 && (rawMsg.includes('API key') || rawMsg.includes('PERMISSION_DENIED'))
  ) {
    return {
      type: 'INVALID_API_KEY',
      provider: 'gemini',
      status: status || 400,
      message: rawMsg,
      userGuidance: 'The configured GEMINI_API_KEY is invalid or lacks access permissions. Please verify your key in Google AI Studio (https://aistudio.google.com/app/apikey).',
    };
  }

  // 2. Unsupported / Retired Model
  if (
    status === 404 ||
    rawMsg.includes('is not found') ||
    rawMsg.includes('is not supported for generateContent') ||
    rawMsg.includes('no longer available') ||
    rawMsg.includes('NOT_FOUND')
  ) {
    return {
      type: 'UNSUPPORTED_MODEL',
      provider: 'gemini',
      status: status || 404,
      message: rawMsg,
      userGuidance: 'The specified Gemini model is retired or unsupported by the current API. Update GEMINI_MODEL="gemini-3.6-flash" in your .env file.',
    };
  }

  // 3. Quota / Rate limit
  if (
    status === 429 ||
    rawMsg.includes('RESOURCE_EXHAUSTED') ||
    rawMsg.includes('Quota exceeded') ||
    rawMsg.includes('rate limit')
  ) {
    return {
      type: 'QUOTA_EXCEEDED',
      provider: 'gemini',
      status: status || 429,
      message: rawMsg,
      userGuidance: 'Gemini API free quota or rate limit has been exceeded. Wait 60 seconds or verify quota limits in Google AI Studio.',
    };
  }

  // 4. Network error
  if (
    rawMsg.includes('ENOTFOUND') ||
    rawMsg.includes('ECONNREFUSED') ||
    rawMsg.includes('ETIMEDOUT') ||
    rawMsg.includes('fetch failed') ||
    rawMsg.includes('NetworkError')
  ) {
    return {
      type: 'NETWORK_ERROR',
      provider: 'gemini',
      message: rawMsg,
      userGuidance: 'Could not connect to Google Gemini API servers. Please check your internet connectivity or firewall/proxy configuration.',
    };
  }

  return {
    type: 'UNKNOWN_ERROR',
    provider: 'gemini',
    status,
    message: rawMsg,
    userGuidance: 'An unexpected error occurred while communicating with Gemini API.',
  };
}

/**
 * Classifies OpenAI API errors for clear terminal diagnostics
 */
export function classifyOpenAiError(err: any): ClassifiedLlmError {
  const status = err.status || err.statusCode || (err.response && err.response.status);
  const rawMsg = err.message || String(err);

  // 1. Quota / Credits Error
  if (
    status === 429 ||
    rawMsg.includes('insufficient_quota') ||
    rawMsg.includes('You have no credits remaining') ||
    rawMsg.includes('billing') ||
    rawMsg.includes('exceeded your current quota')
  ) {
    return {
      type: 'QUOTA_EXCEEDED',
      provider: 'openai',
      status: status || 429,
      message: rawMsg,
      userGuidance: 'OpenAI account has zero credits remaining or exceeded quota. Add billing credits at https://platform.openai.com/settings/organization/billing.',
    };
  }

  // 2. Invalid API Key
  if (status === 401 || rawMsg.includes('Incorrect API key') || rawMsg.includes('invalid_api_key')) {
    return {
      type: 'INVALID_API_KEY',
      provider: 'openai',
      status: status || 401,
      message: rawMsg,
      userGuidance: 'The configured OPENAI_API_KEY is incorrect or has been revoked.',
    };
  }

  // 3. Unsupported Model
  if (status === 404 || rawMsg.includes('model_not_found') || rawMsg.includes('does not exist')) {
    return {
      type: 'UNSUPPORTED_MODEL',
      provider: 'openai',
      status: status || 404,
      message: rawMsg,
      userGuidance: 'The requested OpenAI model does not exist or your account does not have permission to access it.',
    };
  }

  // 4. Network error
  if (
    rawMsg.includes('ENOTFOUND') ||
    rawMsg.includes('ECONNREFUSED') ||
    rawMsg.includes('ETIMEDOUT') ||
    rawMsg.includes('fetch failed')
  ) {
    return {
      type: 'NETWORK_ERROR',
      provider: 'openai',
      message: rawMsg,
      userGuidance: 'Could not connect to OpenAI API servers. Please check your internet connectivity.',
    };
  }

  return {
    type: 'UNKNOWN_ERROR',
    provider: 'openai',
    status,
    message: rawMsg,
    userGuidance: 'An unexpected error occurred while communicating with OpenAI API.',
  };
}

/**
 * Resolves configured model string to a verified currently supported Gemini model.
 * Automatically aliases legacy deprecated models (e.g. gemini-1.5-flash, gemini-2.5-flash) to gemini-3.6-flash.
 */
export function resolveGeminiModel(configuredModel?: string): string {
  const model = (configuredModel || process.env.GEMINI_MODEL || '').trim() || 'gemini-3.6-flash';

  const DEPRECATED_ALIASES: Record<string, string> = {
    'gemini-1.5-flash': 'gemini-3.6-flash',
    'gemini-1.5-flash-latest': 'gemini-3.6-flash',
    'gemini-1.5-pro': 'gemini-3.7-flash',
    'gemini-1.5-pro-latest': 'gemini-3.7-flash',
    'gemini-2.0-flash': 'gemini-3.6-flash',
    'gemini-2.0-flash-exp': 'gemini-3.6-flash',
    'gemini-2.5-flash': 'gemini-3.6-flash',
    'gemini-2.5-flash-lite': 'gemini-3.5-flash-lite',
    'gemini-1.0-pro': 'gemini-3.6-flash',
  };

  if (DEPRECATED_ALIASES[model]) {
    return DEPRECATED_ALIASES[model];
  }

  return model;
}

/**
 * Checks if a real LLM API key is configured in environment
 */
export function isLlmConfigured(): boolean {
  const gemini = process.env.GEMINI_API_KEY?.trim();
  const openai = process.env.OPENAI_API_KEY?.trim();
  return Boolean(gemini || openai);
}

/**
 * Returns active primary provider name or 'none'
 */
export function getActiveLlmProvider(): 'gemini' | 'openai' | 'none' {
  if (process.env.GEMINI_API_KEY?.trim()) return 'gemini';
  if (process.env.OPENAI_API_KEY?.trim()) return 'openai';
  return 'none';
}

/**
 * Generates chat completion with tool calling support using official @google/genai SDK
 * and robust OpenAI fallback.
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
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  // 1. Google Gemini Provider via official @google/genai SDK
  if (geminiKey) {
    try {
      const rawModel = process.env.GEMINI_MODEL?.trim();
      const model = resolveGeminiModel(rawModel);

      const ai = new GoogleGenAI({ apiKey: geminiKey });

      const config: any = {
        temperature: 0.4,
        maxOutputTokens: 1000,
      };

      if (systemPrompt) {
        config.systemInstruction = systemPrompt;
      }

      if (tools && tools.length > 0) {
        config.tools = [
          {
            functionDeclarations: tools.map(t => ({
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            })),
          },
        ];
      }

      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model,
        config,
        contents,
      });

      let text = '';
      try {
        text = response.text || '';
      } catch {}

      const toolCalls: LlmToolCall[] = [];
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          toolCalls.push({
            name: fc.name,
            args: (fc.args as Record<string, any>) || {},
          });
        }
      }

      return {
        text: text.trim(),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        provider: 'gemini',
      };
    } catch (err: any) {
      const classified = classifyGeminiError(err);
      console.warn(`⚠️ [GEMINI ERROR - ${classified.type}]: ${classified.userGuidance}`);
      const sanitized = redactKey(err.message || '', [geminiKey, openaiKey]);
      if (sanitized) {
        console.warn(`   Diagnostic: ${sanitized}`);
      }

      if (openaiKey) {
        console.log('➡️ Attempting secondary fallback provider (OpenAI)...');
      } else {
        console.log('ℹ️ No secondary LLM provider configured — engaging built-in offline engine.');
        return { provider: 'none' };
      }
    }
  }

  // 2. OpenAI Provider (Primary or fallback if Gemini fails)
  if (openaiKey) {
    try {
      const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
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
      const classified = classifyOpenAiError(err);
      const isFallback = Boolean(geminiKey);
      const label = isFallback ? 'OPENAI FALLBACK ERROR' : 'OPENAI ERROR';
      console.warn(`⚠️ [${label} - ${classified.type}]: ${classified.userGuidance}`);
      const sanitized = redactKey(err.message || '', [openaiKey, geminiKey]);
      if (sanitized) {
        console.warn(`   Diagnostic: ${sanitized}`);
      }
      console.log('ℹ️ Cloud providers exhausted — engaging built-in offline engine.');
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
