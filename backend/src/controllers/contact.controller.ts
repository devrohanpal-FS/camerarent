import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many contact messages sent, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

function sanitizeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

const router = Router();

router.post('/', contactLimiter, async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields (name, email, subject, message) are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }

  const cleanName = sanitizeHtml(name);
  const cleanEmail = sanitizeHtml(email);
  const cleanSubject = sanitizeHtml(subject);
  const cleanMessage = sanitizeHtml(message);

  try {
    const contact = await prisma.contactMessage.create({
      data: { 
        name: cleanName, 
        email: cleanEmail, 
        subject: cleanSubject, 
        message: cleanMessage 
      },
    });

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Contact Inquiry - CameraRent</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <tr>
      <td style="background-color: #0f172a; padding: 28px 24px; text-align: center;">
        <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
            <td style="background-color: #2563eb; padding: 8px; border-radius: 8px; text-align: center; vertical-align: middle;">
              <span style="font-size: 20px; line-height: 1; color: #ffffff;">📷</span>
            </td>
            <td style="padding-left: 12px; vertical-align: middle; text-align: left;">
              <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Camera<span style="color: #3b82f6;">Rent</span></span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Body -->
    <tr>
      <td style="padding: 32px 24px;">
        <h2 style="margin-top: 0; margin-bottom: 8px; font-size: 20px; font-weight: 800; color: #0f172a;">New Contact Inquiry Received</h2>
        <p style="margin-top: 0; margin-bottom: 24px; font-size: 13px; color: #64748b; line-height: 1.5;">A visitor has submitted a new message through the CameraRent Contact Us form. Details are listed below:</p>
        
        <!-- Details Card -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: left;">
          <tr>
            <td style="padding-bottom: 12px; width: 100px; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top;">Name</td>
            <td style="padding-bottom: 12px; font-size: 13px; font-weight: 600; color: #0f172a; vertical-align: top;">${cleanName}</td>
          </tr>
          <tr>
            <td style="padding-bottom: 12px; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top;">Email</td>
            <td style="padding-bottom: 12px; font-size: 13px; font-weight: 600; color: #2563eb; vertical-align: top;">
              <a href="mailto:${cleanEmail}" style="color: #2563eb; text-decoration: none;">${cleanEmail}</a>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 12px; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top;">Subject</td>
            <td style="padding-bottom: 12px; font-size: 13px; font-weight: 600; color: #0f172a; vertical-align: top;">${cleanSubject}</td>
          </tr>
          <tr>
            <td style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding-top: 4px;">Message</td>
            <td style="font-size: 13px; color: #334155; line-height: 1.6; padding-top: 4px; vertical-align: top;">
              ${cleanMessage.replace(/\n/g, '<br>')}
            </td>
          </tr>
        </table>
        
        <!-- Action Button -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center">
              <a href="mailto:${cleanEmail}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: bold; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(37 99 235 / 0.15);">
                Reply Directly via Email
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 10px; color: #94a3b8; line-height: 1.5;">
        <p style="margin: 0 0 4px 0;">This email was automatically generated and sent to rohanpaldeveloper@gmail.com.</p>
        <p style="margin: 0;">© 2026 CameraRent Inc. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const previewsDir = path.join(__dirname, '../../sent-emails');
    if (!fs.existsSync(previewsDir)) {
      fs.mkdirSync(previewsDir, { recursive: true });
    }
    const previewFilename = `message-${Date.now()}.html`;
    const previewPath = path.join(previewsDir, previewFilename);
    fs.writeFileSync(previewPath, htmlContent, 'utf8');
    console.log(`[Email Simulator] Styled HTML email written to: ${previewPath}`);

    let etherealUrl = '';
    try {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await transporter.sendMail({
        from: '"CameraRent Support" <support@camerarent.com>',
        to: 'rohanpaldeveloper@gmail.com',
        subject: `[Contact Form] ${cleanSubject}`,
        text: `New message from ${cleanName} (${cleanEmail}): ${cleanMessage}`,
        html: htmlContent,
      });

      etherealUrl = nodemailer.getTestMessageUrl(info) || '';
      console.log(`[Email Sent] Ethereal live preview URL: ${etherealUrl}`);
    } catch (mailErr) {
      console.error('[Mail Send Warn] Failed to send ethereal email, logged to file. Details:', mailErr);
    }

    res.status(201).json({
      message: 'Inquiry submitted successfully!',
      contact,
      previewFile: `/sent-emails/${previewFilename}`,
      emailUrl: etherealUrl || undefined,
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ error: 'Failed to save contact message' });
  }
});

router.get(
  '/',
  authMiddleware,
  requireRole(['ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const messages = await prisma.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.json(messages);
    } catch (error) {
      console.error('Fetch contact messages error:', error);
      res.status(500).json({ error: 'Failed to fetch contact messages' });
    }
  }
);

export default router;
