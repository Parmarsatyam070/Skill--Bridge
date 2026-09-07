import { describe, it, expect, vi } from 'vitest';
import { isLlmConfigured, getActiveLlmProvider, callLlmChat, generateLlmText } from '../server/src/services/llmService.js';
import { sendPasswordResetEmail, sendSmsOtp } from '../server/src/services/notificationService.js';

describe('SkillBridge Service Integrations Suite: LLM, Notifications, and Stat Integrity', () => {
  describe('LLM Integration & Offline Fallback', () => {
    it('should report correct provider status based on environment', () => {
      const configured = isLlmConfigured();
      const provider = getActiveLlmProvider();
      expect(typeof configured).toBe('boolean');
      expect(['gemini', 'openai', 'none']).toContain(provider);
    });

    it('should gracefully fallback to offline engine when no LLM API key is present', async () => {
      const origGemini = process.env.GEMINI_API_KEY;
      const origOpenai = process.env.OPENAI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      try {
        const result = await callLlmChat({
          systemPrompt: 'You are a test assistant.',
          messages: [{ role: 'user', content: 'Hello' }],
        });

        expect(result.provider).toBe('none');
      } finally {
        if (origGemini !== undefined) process.env.GEMINI_API_KEY = origGemini;
        if (origOpenai !== undefined) process.env.OPENAI_API_KEY = origOpenai;
      }
    });

    it('should return null or fallback cleanly for single-turn generateLlmText without key', async () => {
      const origGemini = process.env.GEMINI_API_KEY;
      const origOpenai = process.env.OPENAI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      try {
        const text = await generateLlmText({
          systemPrompt: 'You are a resume writer.',
          prompt: 'Generate summary for Software Engineer',
        });

        expect(text).toBeNull();
      } finally {
        if (origGemini !== undefined) process.env.GEMINI_API_KEY = origGemini;
        if (origOpenai !== undefined) process.env.OPENAI_API_KEY = origOpenai;
      }
    });
  });

  describe('Notification Service & Warning Telemetry', () => {
    it('should gracefully fall back to console with [WARN] telemetry when email keys are unset', async () => {
      const warnSpy = vi.spyOn(console, 'warn');
      const logSpy = vi.spyOn(console, 'log');

      const result = await sendPasswordResetEmail({
        to: 'student@example.com',
        resetUrl: 'http://localhost:5173/reset-password?token=test-123',
        token: 'test-123',
      });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('console-fallback');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]')
      );

      warnSpy.mockRestore();
      logSpy.mockRestore();
    });

    it('should gracefully fall back to console with [WARN] telemetry when SMS keys are unset', async () => {
      const warnSpy = vi.spyOn(console, 'warn');
      const logSpy = vi.spyOn(console, 'log');

      const result = await sendSmsOtp({
        phone: '+919876543210',
        otpCode: '123456',
      });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('console-fallback');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]')
      );

      warnSpy.mockRestore();
      logSpy.mockRestore();
    });
  });
});
