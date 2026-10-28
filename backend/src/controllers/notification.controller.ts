import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

router.put('/read-all', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/read', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
