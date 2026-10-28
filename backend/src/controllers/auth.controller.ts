import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { createNotification, notifyAdmins } from '../utils/notification';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secure-camerarent-secret-key-2026';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        vendorProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let isMatch = false;
    const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');

    if (isHashed) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = user.password === password;
      if (isMatch) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
      }
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        kycStatus: user.kycStatus,
        kycDocUrl: user.kycDocUrl,
        vendorProfile: user.vendorProfile ? {
          id: user.vendorProfile.id,
          name: user.vendorProfile.name,
        } : null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

router.post('/signup', authLimiter, async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'CUSTOMER',
        kycStatus: 'NONE',
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        kycStatus: user.kycStatus,
        kycDocUrl: null,
        vendorProfile: null,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  res.json({ user: req.user });
});

router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;

  try {
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== req.user!.id) {
        return res.status(400).json({ error: 'Email address is already in use' });
      }
      updateData.email = email;
    }
    if (phone !== undefined) updateData.phone = phone || null;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        kycStatus: updatedUser.kycStatus,
        kycDocUrl: updatedUser.kycDocUrl,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile details' });
  }
});

router.put('/kyc', authMiddleware, async (req: Request, res: Response) => {
  const { kycDocUrl } = req.body;

  if (!kycDocUrl || typeof kycDocUrl !== 'string') {
    return res.status(400).json({ error: 'KYC Document is required' });
  }

  try {
    let finalDocUrl = kycDocUrl;

    if (kycDocUrl.startsWith('data:')) {
      const match = kycDocUrl.match(/^data:([a-zA-Z0-9+/.-]+);base64,(.+)$/);
      if (match) {
        const mime = match[1].toLowerCase();
        const base64Data = match[2];
        let ext = 'jpg';
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('pdf')) ext = 'pdf';
        else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';

        const uploadDir = path.join(__dirname, '../../uploads/kyc');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const safeUserId = req.user!.id.replace(/[^a-zA-Z0-9-]/g, '');
        const filename = `kyc-${safeUserId}-${Date.now()}.${ext}`;
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

        finalDocUrl = `/uploads/kyc/${filename}`;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        kycDocUrl: finalDocUrl,
        kycStatus: 'PENDING',
      },
    });

    await createNotification(
      req.user!.id,
      'KYC Uploaded',
      'Your KYC documents have been successfully submitted and are pending administrative review.',
      'KYC_STATUS'
    );
    await notifyAdmins(
      'New KYC Submission',
      `User ${req.user!.name} has uploaded their KYC document for review.`,
      'KYC_STATUS'
    );

    res.json({
      message: 'KYC documents submitted. Pending administrative review.',
      kycStatus: 'PENDING',
      kycDocUrl: updatedUser.kycDocUrl,
    });
  } catch (error) {
    console.error('KYC update error:', error);
    res.status(500).json({ error: 'Internal server error during KYC submission' });
  }
});

router.get('/admin/kyc-pending', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { kycStatus: 'PENDING' },
      select: {
        id: true,
        name: true,
        email: true,
        kycStatus: true,
        kycDocUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Fetch pending KYC users error:', error);
    res.status(500).json({ error: 'Failed to fetch pending KYC users' });
  }
});

router.put('/admin/kyc/:userId', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!status || !['NONE', 'PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Status must be NONE, PENDING, APPROVED or REJECTED' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: status },
    });

    await createNotification(userId, 'KYC Verification Update', `Your KYC verification request status is updated to ${status}.`, 'KYC_STATUS');
    await notifyAdmins('KYC Status Resolved', `User ${updatedUser.name} KYC has been resolved as ${status}.`, 'KYC_STATUS');

    res.json({
      message: `KYC status updated to ${status} for user ${updatedUser.name}`,
      userId,
      kycStatus: updatedUser.kycStatus,
    });
  } catch (error) {
    console.error('Update KYC status error:', error);
    res.status(500).json({ error: 'Failed to update user KYC status' });
  }
});

router.get('/admin/users', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        kycStatus: true,
        kycDocUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Fetch all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

router.post('/admin/users', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role,
        kycStatus: role === 'ADMIN' ? 'APPROVED' : 'NONE',
      },
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        kycStatus: newUser.kycStatus,
      },
    });
  } catch (error) {
    console.error('Create user by admin error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.delete('/admin/users/:id', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  const { id } = req.params;

  if (req.user!.id === id) {
    return res.status(400).json({ error: 'Self-deletion is forbidden. You cannot delete your own admin account.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
