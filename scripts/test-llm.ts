/**
 * SkillBridge AI / LLM Verification Utility
 * 
 * Verifies that GEMINI_API_KEY and/or OPENAI_API_KEY are properly configured,
 * loads them through the server env loader, and executes a live test completion.
 * 
 * Usage:
 *   npm run test:llm
 */

import '../server/src/config/env.js';
import {
  isLlmConfigured,
  getActiveLlmProvider,
  callLlmChat,
  resolveGeminiModel,
} from '../server/src/services/llmService.js';

async function main() {
  console.log('\n======================================================');
  console.log('🤖 SkillBridge AI Connectivity & Credentials Tester');
  console.log('======================================================\n');

  const rawGeminiKey = process.env.GEMINI_API_KEY?.trim();
  const rawOpenaiKey = process.env.OPENAI_API_KEY?.trim();
  const geminiConfigured = Boolean(rawGeminiKey);
  const openaiConfigured = Boolean(rawOpenaiKey);

  const rawGeminiModel = process.env.GEMINI_MODEL?.trim();
  const resolvedGeminiModel = resolveGeminiModel(rawGeminiModel);
  const geminiModelDisplay = rawGeminiModel && rawGeminiModel !== resolvedGeminiModel
    ? `${rawGeminiModel} (auto-mapped to supported: ${resolvedGeminiModel})`
    : resolvedGeminiModel;

  const openaiModel = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  console.log('🔍 Environment Configuration Detection:');
  console.log(`  • GEMINI_API_KEY:  ${geminiConfigured ? '✅ Set' : '❌ Not Set'}`);
  if (geminiConfigured) {
    console.log(`    ↳ Model:         ${geminiModelDisplay}`);
    console.log(`    ↳ SDK:           @google/genai (official SDK)`);
  }
  console.log(`  • OPENAI_API_KEY:  ${openaiConfigured ? '✅ Set' : '❌ Not Set'}`);
  if (openaiConfigured) {
    console.log(`    ↳ Model:         ${openaiModel}`);
    console.log(`    ↳ Role:          ${geminiConfigured ? 'Automatic Fallback Provider' : 'Primary Provider'}`);
  }

  const activeProvider = getActiveLlmProvider();
  console.log(`\n🎯 Active Primary Provider: ${activeProvider.toUpperCase()}\n`);

  if (!isLlmConfigured()) {
    console.log('⚠️  No active LLM API keys detected in .env or server/.env.');
    console.log('   Please configure your keys in .env:');
    console.log('     GEMINI_API_KEY="..."');
    console.log('     GEMINI_MODEL="gemini-3.6-flash"');
    console.log('   or');
    console.log('     OPENAI_API_KEY="..."\n');
    console.log('ℹ️  SkillBridge will continue using its built-in offline smart heuristics.');
    process.exit(0);
  }

  console.log(`🚀 Sending live verification prompt to ${activeProvider.toUpperCase()}...`);
  const startTime = Date.now();

  try {
    const response = await callLlmChat({
      systemPrompt: 'You are Sash, the AI career and learning mentor for SkillBridge. Respond concisely in 1-2 sentences.',
      messages: [
        {
          role: 'user',
          content: 'SkillBridge system test: Verify connectivity and state your operational status.',
        },
      ],
    });

    const duration = Date.now() - startTime;

    if (response.provider === 'gemini' && response.text) {
      console.log('\n======================================================');
      console.log('🎉 [SUCCESS] Google Gemini is ONLINE and operational!');
      console.log('======================================================');
      console.log(`⏱️  Response Latency: ${duration}ms`);
      console.log(`🏷️  Active Provider:  GOOGLE GEMINI`);
      console.log(`🧠  Active Model:     ${resolvedGeminiModel}`);
      console.log(`💬  Model Response:   "${response.text}"\n`);
      console.log('✨ Live Features Powered by Gemini:');
      console.log('   ✓ Bridge Bot (Sash) Interactive Chat & Mentorship');
      console.log('   ✓ Skill Gap Analysis & Tool-Calling Recommendations');
      console.log('   ✓ AI Mock Technical & HR Interviews (Speech/Text)');
      console.log('   ✓ AI Resume Headline & Summary Generation');
      console.log('   ✓ Student Portfolio Copy & Bio Generation');
      console.log('   ✓ Adaptive Daily Targets & Practice Sets\n');
    } else if (response.provider === 'openai' && response.text) {
      console.log('\n======================================================');
      console.log('🎉 [SUCCESS] OpenAI is ONLINE and operational!');
      console.log('======================================================');
      console.log(`⏱️  Response Latency: ${duration}ms`);
      console.log(`🏷️  Active Provider:  OPENAI`);
      console.log(`🧠  Active Model:     ${openaiModel}`);
      console.log(`💬  Model Response:   "${response.text}"\n`);
    } else {
      console.warn('\n⚠️ [NOTICE] Provider call fell back to built-in offline engine.');
      console.warn('   Check terminal diagnostic warnings above for quota, key, or network details.\n');
    }
  } catch (err: any) {
    console.error('\n❌ [ERROR] Verification failed with exception:', err.message);
  }
}

main();
