import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        kycStatus: string;
        kycDocUrl: string | null;
        phone: string | null;
        vendorProfile?: {
          id: string;
          name: string;
        } | null;
      };
    }
  }
}

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secure-camerarent-secret-key-2026';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is missing' });
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7).trim() 
    : authHeader.trim();

  if (!token) {
    return res.status(401).json({ error: 'Invalid authorization token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        vendorProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User session not found or invalid' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      kycStatus: user.kycStatus,
      kycDocUrl: user.kycDocUrl,
      phone: user.phone,
      vendorProfile: user.vendorProfile ? {
        id: user.vendorProfile.id,
        name: user.vendorProfile.name,
      } : null,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
    }
    res.status(500).json({ error: 'Internal server authentication error' });
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden. Requires one of these roles: ${roles.join(', ')}` });
    }

    next();
  };
}
