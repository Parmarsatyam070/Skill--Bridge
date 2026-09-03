import { Router, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { hasCompletedPracticeSetToday } from '../services/streakService.js';

const router = Router();

/**
 * GET /api/notifications
 * Retrieves all in-app notifications for the authenticated user
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }

  // Check if daily practice is pending and ensure a reminder notification exists
  const completedToday = await hasCompletedPracticeSetToday(userId);
  if (!completedToday) {
    const todayStr = new Date().toISOString().split('T')[0];
    const existingTodayReminder = await prisma.inAppNotification.findFirst({
      where: {
        userId,
        type: 'DAILY_PRACTICE',
        createdAt: {
          gte: new Date(`${todayStr}T00:00:00.000Z`),
        },
      },
    });

    if (!existingTodayReminder) {
      await prisma.inAppNotification.create({
        data: {
          userId,
          title: "🎯 Today's Practice Pending",
          message: "Complete at least 1 practice set today to keep your streak active and prevent skill radar decay.",
          type: 'DAILY_PRACTICE',
          link: '/assessment',
        },
      });
    }
  }

  const notifications = await prisma.inAppNotification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return res.json({
    notifications: notifications.map(n => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      link: n.link || undefined,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
    dailyPracticeCompletedToday: completedToday,
  });
});

/**
 * POST /api/notifications/mark-read
 * Marks a single notification or all notifications as read
 */
router.post('/mark-read', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }

  const { notificationId } = req.body;

  if (notificationId) {
    await prisma.inAppNotification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  } else {
    // Mark all as read
    await prisma.inAppNotification.updateMany({
      where: { userId },
      data: { read: true },
    });
  }

  return res.json({ message: 'Notifications marked as read' });
});

export default router;
