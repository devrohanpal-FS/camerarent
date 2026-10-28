import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import fs from 'fs';
import path from 'path';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contents = await prisma.cmsContent.findMany();
    const result: Record<string, any> = {};
    for (const item of contents) {
      try {
        result[item.key] = JSON.parse(item.value);
      } catch {
        result[item.key] = item.value;
      }
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const item = await prisma.cmsContent.findUnique({
      where: { key },
    });
    if (!item) {
      return res.status(404).json({ error: `CMS configuration key '${key}' not found.` });
    }
    try {
      res.json(JSON.parse(item.value));
    } catch {
      res.json(item.value);
    }
  } catch (err) {
    next(err);
  }
});

router.put('/:key', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

    const updated = await prisma.cmsContent.upsert({
      where: { key },
      update: { value: valueStr },
      create: { key, value: valueStr },
    });

    try {
      res.json({ key: updated.key, value: JSON.parse(updated.value) });
    } catch {
      res.json({ key: updated.key, value: updated.value });
    }
  } catch (err) {
    next(err);
  }
});

router.post('/upload', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, base64 } = req.body;

    if (!name || !base64) {
      return res.status(400).json({ error: 'Filename (name) and base64 string are required.' });
    }

    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(name) || '.png';
    const baseName = path.basename(name, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${baseName}_${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const port = process.env.PORT || 5001;
    const url = `http://localhost:${port}/uploads/${fileName}`;

    res.json({ url });
  } catch (err) {
    next(err);
  }
});

export default router;
