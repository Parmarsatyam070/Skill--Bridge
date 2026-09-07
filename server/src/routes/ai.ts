import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { processChat } from '../services/aiAssistant.js';
import { getStudentMemories, deleteStudentMemory } from '../services/sashMemoryService.js';

const router = Router();

/**
 * POST /api/ai/chat
 */
router.post('/chat', authenticate, async (req: AuthRequest, res: Response) => {
  const { prompt, history, activeDomain, pageContext } = req.body;

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
    const response = await processChat(prompt, userContext, history || [], activeDomain, pageContext);
    return res.json(response);
  } catch (error: any) {
    console.error('AI chat error:', error);
    return res.status(500).json({
      error: { code: 'AI_ERROR', message: 'Sash is temporarily unavailable.' }
    });
  }
});

/**
 * GET /api/ai/memory
 * Retrieves stored personal facts and conversation summaries strictly for the authenticated student.
 */
router.get('/memory', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(400).json({ error: { code: 'NO_PROFILE', message: 'Student profile required to view memory.' } });
  }

  try {
    const memories = await getStudentMemories(studentProfileId);
    return res.json({ memories, totalCount: memories.length });
  } catch (error: any) {
    console.error('Failed to get Sash memories:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Could not fetch stored memories.' } });
  }
});

/**
 * DELETE /api/ai/memory/:id
 * Deletes a specific stored memory item owned by the authenticated student.
 */
router.delete('/memory/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(400).json({ error: { code: 'NO_PROFILE', message: 'Student profile required.' } });
  }

  const memoryId = req.params.id;

  try {
    const result = await deleteStudentMemory(studentProfileId, memoryId);
    return res.json({ message: 'Memory item deleted', count: result.count });
  } catch (error: any) {
    console.error('Failed to delete Sash memory:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Could not delete memory item.' } });
  }
});

/**
 * DELETE /api/ai/memory
 * Purges all stored memories for the authenticated student (privacy clear-all).
 */
router.delete('/memory', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(400).json({ error: { code: 'NO_PROFILE', message: 'Student profile required.' } });
  }

  try {
    const result = await deleteStudentMemory(studentProfileId);
    return res.json({ message: 'All student memories cleared', count: result.count });
  } catch (error: any) {
    console.error('Failed to clear Sash memories:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Could not clear memories.' } });
  }
});

export default router;
