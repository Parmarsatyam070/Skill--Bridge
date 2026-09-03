import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { processChat } from '../services/aiAssistant.js';

const router = Router();

/**
 * POST /api/ai/chat
 */
router.post('/chat', authenticate, async (req: AuthRequest, res: Response) => {
  const { prompt, history, activeDomain } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Prompt is required.' } });
  }

  const userContext = {
    id: req.user!.id,
    name: req.user!.email.split('@')[0],
    role: req.user!.role,
    studentProfileId: req.user!.studentProfileId,
  };

  try {
    const response = await processChat(prompt, userContext, history || [], activeDomain);
    return res.json(response);
  } catch (error: any) {
    console.error('AI chat error:', error);
    return res.status(500).json({
      error: { code: 'AI_ERROR', message: 'Bridge Bot is temporarily unavailable.' }
    });
  }
});

export default router;
