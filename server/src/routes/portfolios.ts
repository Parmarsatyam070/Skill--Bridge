import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import {
  getOrCreateStudentPortfolio,
  generateAIWizardPortfolio,
  updateStudentPortfolio,
  getPublicPortfolio,
  savePortfolioMessage,
  getPortfolioMessages,
  handlePublicBotChat,
} from '../services/portfolioService.js';
import {
  SavePortfolioWebsiteSchema,
  PortfolioContactMessageSchema,
  AIWizardGenerateSchema,
} from '../../../shared/validation.js';

const router = Router();

// Setup local uploads storage for portfolio media
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const portfolioImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'portfolio-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

const imageUpload = multer({
  storage: portfolioImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) && (file.mimetype.startsWith('image/') || file.mimetype === 'image/svg+xml')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, JPEG, WEBP, SVG) up to 10MB are allowed.'));
    }
  },
});

/**
 * GET /api/portfolios/me
 * Retrieves current student's portfolio website data or initializes default.
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only students have personal portfolio websites.' } });
  }

  try {
    const portfolio = await getOrCreateStudentPortfolio(studentProfileId);
    return res.json({ portfolio });
  } catch (error: any) {
    console.error('Error fetching portfolio:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * POST /api/portfolios/ai-wizard
 * Generates polished portfolio content using the AI wizard.
 */
router.post('/ai-wizard', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only students can generate portfolio content.' } });
  }

  const parsed = AIWizardGenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: parsed.error.format() } });
  }

  try {
    const portfolio = await generateAIWizardPortfolio(studentProfileId, parsed.data);
    return res.json({ portfolio, message: 'Portfolio generated successfully with AI!' });
  } catch (error: any) {
    console.error('Error generating AI portfolio:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * PUT /api/portfolios/me
 * Saves updates or drafts for the current student's portfolio.
 */
router.put('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only students can edit their portfolio.' } });
  }

  const parsed = SavePortfolioWebsiteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: parsed.error.format() } });
  }

  try {
    const portfolio = await updateStudentPortfolio(studentProfileId, parsed.data as any);
    return res.json({ portfolio, message: 'Portfolio saved successfully.' });
  } catch (error: any) {
    console.error('Error updating portfolio:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * POST /api/portfolios/me/publish
 * Toggles publish status or publishes portfolio.
 */
router.post('/me/publish', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only students can publish their portfolio.' } });
  }

  const { status, slug } = req.body;

  try {
    const portfolio = await updateStudentPortfolio(studentProfileId, {
      status: status || 'PUBLISHED',
      ...(slug ? { slug } : {}),
    });
    return res.json({
      portfolio,
      message: portfolio.status === 'PUBLISHED' ? 'Portfolio published live!' : 'Portfolio moved to draft.',
      shareableUrl: `/p/${portfolio.slug}`,
    });
  } catch (error: any) {
    console.error('Error publishing portfolio:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * POST /api/portfolios/upload-image
 * Uploads hero visual or about me image.
 */
router.post('/upload-image', authenticate, imageUpload.single('image'), (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Image file is required.' } });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  return res.json({ imageUrl, message: 'Image uploaded successfully.' });
});

/**
 * GET /api/portfolios/me/messages
 * Retrieves visitor contact messages for the student's portfolio.
 */
router.get('/me/messages', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only students can access their messages.' } });
  }

  try {
    const messages = await getPortfolioMessages(studentProfileId);
    return res.json({ messages });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/portfolios/public/:slugOrId
 * Public endpoint to view a published portfolio website.
 */
router.get('/public/:slugOrId', async (req, res) => {
  const { slugOrId } = req.params;
  const allowDraft = req.query.preview === 'true';

  try {
    const portfolio = await getPublicPortfolio(slugOrId, allowDraft);
    if (!portfolio) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Portfolio not found or not currently published.' } });
    }
    return res.json({ portfolio });
  } catch (error: any) {
    console.error('Error fetching public portfolio:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * POST /api/portfolios/public/:slugOrId/contact
 * Public visitor contact form submission.
 */
router.post('/public/:slugOrId/contact', async (req, res) => {
  const { slugOrId } = req.params;
  const parsed = PortfolioContactMessageSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: parsed.error.format() } });
  }

  try {
    const message = await savePortfolioMessage(slugOrId, parsed.data);
    return res.json({ message: 'Your message has been sent to the student.', messageId: message.id });
  } catch (error: any) {
    console.error('Error saving contact message:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * POST /api/portfolios/public/:slugOrId/chat
 * Public floating chatbot scoped strictly to the student's verified public data.
 */
router.post('/public/:slugOrId/chat', async (req, res) => {
  const { slugOrId } = req.params;
  const userText = req.body.prompt || req.body.message;

  if (!userText || typeof userText !== 'string') {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Prompt or message is required.' } });
  }

  try {
    const reply = await handlePublicBotChat(slugOrId, userText);
    const suggestions = [
      'What are your top projects?',
      'Which tech stack do you use?',
      'How can I get in touch?',
    ];
    return res.json({ reply, message: reply, suggestions });
  } catch (error: any) {
    console.error('Error handling public bot chat:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

export default router;
