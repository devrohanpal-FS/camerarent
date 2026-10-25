import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../db';
import { checkProductAvailability, getUnavailableDates } from '../services/availability.service';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_PROXY_DOMAINS,
  imageProxyLimiter,
  MAX_PROXY_IMAGE_SIZE,
  PayloadTooLargeError,
  streamImageWithLimit,
  validateDns,
} from '../utils/ssrf';

const router = Router();

// Upload one or more product images (accepts base64 dataUrls and stores files in /uploads/products)
router.post(
  '/upload-images',
  authMiddleware,
  requireRole(['ADMIN', 'VENDOR']),
  async (req: Request, res: Response) => {
    try {
      const { files } = req.body as {
        files?: Array<{ name?: string; dataUrl: string }>;
      };

      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: 'No image files provided' });
      }

      const uploadDir = path.join(__dirname, '../../uploads/products');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const host = req.get('host') || 'localhost:5002';
      const protocol = req.protocol || 'http';
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        if (!item?.dataUrl || typeof item.dataUrl !== 'string') continue;

        const match = item.dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (!match) {
          // If it's already a regular URL, keep it
          if (item.dataUrl.startsWith('http') || item.dataUrl.startsWith('/uploads')) {
            uploadedUrls.push(item.dataUrl);
          }
          continue;
        }

        const rawExt = match[1].toLowerCase();
        const ext = rawExt === 'jpeg' ? 'jpg' : rawExt.replace(/[^a-z0-9]/g, '') || 'jpg';
        const base64Data = match[2];
        const safeBaseName = (item.name || `product-${i + 1}`)
          .replace(/\.[^/.]+$/, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 40);

        const filename = `${Date.now()}-${i}-${safeBaseName || 'img'}.${ext}`;
        const filePath = path.join(uploadDir, filename);

        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        uploadedUrls.push(`${protocol}://${host}/uploads/products/${filename}`);
      }

      res.status(201).json({ urls: uploadedUrls });
    } catch (error: any) {
      console.error('Upload product images error:', error);
      res.status(500).json({
        error: 'Failed to upload product images',
        message: error.message,
      });
    }
  }
);

// Get all categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// List all products with filters
router.get('/', async (req: Request, res: Response) => {
  const { category, subcategory, vendorId, search, startDate, endDate } = req.query;

  try {
    const whereClause: any = {};

    // 1. Category Filter
    if (category) {
      whereClause.category = {
        slug: category as string,
      };
    }

    // Subcategory Filter
    if (subcategory) {
      whereClause.subcategory = subcategory as string;
    }

    // 2. Vendor Filter
    if (vendorId) {
      whereClause.vendorId = vendorId as string;
    }

    // 3. Search Filter (name/description)
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    // 4. Date Availability Filter
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      if (start <= end) {
        // Find product IDs that have overlapping blackouts
        const blackoutProducts = await prisma.productAvailabilityBlackout.findMany({
          where: {
            NOT: [
              { endDate: { lt: start } },
              { startDate: { gt: end } },
            ],
          },
          select: { productId: true },
        });

        // Find product IDs that have overlapping active bookings
        const bookedProducts = await prisma.orderItem.findMany({
          where: {
            order: {
              status: { not: 'CANCELLED' },
            },
            NOT: [
              { endDate: { lt: start } },
              { startDate: { gt: end } },
            ],
          },
          select: { productId: true },
        });

        // Combine excluded IDs
        const excludedProductIds = Array.from(
          new Set([
            ...blackoutProducts.map((bp) => bp.productId),
            ...bookedProducts.map((bp) => bp.productId),
          ])
        );

        if (excludedProductIds.length > 0) {
          whereClause.id = {
            notIn: excludedProductIds,
          };
        }
      }
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        vendor: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Proxy remote images to avoid browser hotlinking blocks (Protected against SSRF)
router.get('/proxy-image', imageProxyLimiter, async (req: Request, res: Response) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL query parameter is required' });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // 1. Enforce HTTPS only (no HTTP allowed since no DB products use HTTP)
  if (targetUrl.protocol !== 'https:') {
    return res.status(400).json({ error: 'Invalid URL protocol. Only HTTPS is permitted.' });
  }

  // 2. Enforce strict exact domain allowlist (no wildcard subdomain bypasses)
  const hostname = targetUrl.hostname.toLowerCase();
  if (!ALLOWED_PROXY_DOMAINS.includes(hostname)) {
    return res.status(403).json({ error: 'Forbidden: Domain is not allowed for proxying.' });
  }

  // 3. Prevent DNS rebinding / Private IP access (check all resolved IPs)
  const dnsCheck = await validateDns(hostname);
  if (!dnsCheck.safe) {
    return res.status(403).json({ error: dnsCheck.error });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    // 4. Fetch with timeout and strict redirect refusal (redirect: 'error')
    let response: any;
    try {
      response = await fetch(targetUrl.toString(), {
        signal: controller.signal,
        redirect: 'error',
        headers: {
          'User-Agent': 'CameraRent-ImageProxy/1.0',
          'Accept': 'image/webp,image/avif,image/png,image/jpeg,image/*;q=0.8',
        },
      });
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({ error: 'Remote image request timed out' });
      }
      return res.status(502).json({ error: 'Failed to connect to remote image host', message: fetchErr.message });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch remote image' });
    }

    // 5. Content-Type validation (prevent non-image MIME types and SVG XSS)
    const rawContentType = response.headers.get('content-type') || '';
    const contentType = rawContentType.split(';')[0].trim().toLowerCase();
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(contentType)) {
      return res.status(400).json({ error: 'Remote URL did not return an allowed image content-type' });
    }

    // 6. Response streaming with strict 5MB cutoff (does not rely on Content-Length)
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PROXY_IMAGE_SIZE) {
      return res.status(413).json({ error: 'Image exceeds maximum allowable size of 5MB' });
    }

    let buffer: Buffer;
    try {
      buffer = await streamImageWithLimit(response.body, controller, MAX_PROXY_IMAGE_SIZE);
    } catch (streamErr: any) {
      if (streamErr instanceof PayloadTooLargeError || streamErr?.code === 'PAYLOAD_TOO_LARGE') {
        return res.status(413).json({ error: 'Image exceeds maximum allowable size of 5MB' });
      }
      throw streamErr;
    }

    // 7. Safe cache and security headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    res.send(buffer);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Remote image request timed out' });
    }
    console.error('Image proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy image', message: error.message });
  } finally {
    clearTimeout(timeoutId);
  }
});

// Get a single product details
router.get('/:idOrSlug', async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;

  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
      },
      include: {
        category: true,
        vendor: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Fetch product detail error:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// Get unavailable dates (calendar support)
router.get('/:id/unavailable-dates', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const dates = await getUnavailableDates(id);
    res.json(dates);
  } catch (error) {
    console.error('Fetch unavailable dates error:', error);
    res.status(500).json({ error: 'Failed to fetch unavailable dates' });
  }
});

// Get range-based stock availability details
router.get('/:id/stock-availability', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { totalStock: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const totalStock = product.totalStock;

    if (!startDate || !endDate) {
      return res.json({
        totalStock,
        bookedCount: 0,
        availableStock: totalStock,
      });
    }

    const start = new Date(startDate as string);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate as string);
    end.setUTCHours(23, 59, 59, 999);

    if (start > end) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    // Find all overlapping active bookings
    const bookings = await prisma.orderItem.findMany({
      where: {
        productId: id,
        order: {
          status: { not: 'CANCELLED' },
        },
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });

    // Check blackout
    const overlappingBlackout = await prisma.productAvailabilityBlackout.findFirst({
      where: {
        productId: id,
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });

    if (overlappingBlackout) {
      return res.json({
        totalStock,
        bookedCount: totalStock,
        availableStock: 0,
        reason: 'Administrative blackout / maintenance',
      });
    }

    // Find max booked units on any day in the range
    let maxBookedQty = 0;
    const day = new Date(start);
    while (day <= end) {
      let bookedQty = 0;
      for (const booking of bookings) {
        const bStart = new Date(booking.startDate);
        bStart.setUTCHours(0, 0, 0, 0);
        const bEnd = new Date(booking.endDate);
        bEnd.setUTCHours(23, 59, 59, 999);
        if (day >= bStart && day <= bEnd) {
          bookedQty += booking.quantity;
        }
      }
      if (bookedQty > maxBookedQty) {
        maxBookedQty = bookedQty;
      }
      day.setUTCDate(day.getUTCDate() + 1);
    }

    const availableStock = Math.max(0, totalStock - maxBookedQty);

    res.json({
      totalStock,
      bookedCount: maxBookedQty,
      availableStock,
    });
  } catch (error) {
    console.error('Fetch stock availability error:', error);
    res.status(500).json({ error: 'Failed to fetch stock availability' });
  }
});

// Admin/Vendor Add Product
router.post(
  '/',
  authMiddleware,
  requireRole(['ADMIN', 'VENDOR']),
  async (req: Request, res: Response) => {
    const { name, description, specs, dailyRate, weeklyRate, depositAmount, images, categoryId, subcategory, vendorId, totalStock } = req.body;

    if (!name || !description || !specs || !dailyRate || !weeklyRate || !depositAmount || !images || !categoryId) {
      return res.status(400).json({ error: 'Missing required product fields' });
    }

    try {
      // Determine which vendor owns the product
      let actualVendorId = vendorId;

      if (req.user!.role === 'VENDOR') {
        if (!req.user!.vendorProfile) {
          return res.status(403).json({ error: 'User does not have an active vendor profile' });
        }
        actualVendorId = req.user!.vendorProfile.id;
      } else if (req.user!.role === 'ADMIN' && !actualVendorId) {
        return res.status(400).json({ error: 'Admin must specify vendorId' });
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const product = await prisma.product.create({
        data: {
          name,
          slug,
          description,
          specs: typeof specs === 'string' ? specs : JSON.stringify(specs),
          dailyRate: Number(dailyRate),
          weeklyRate: Number(weeklyRate),
          depositAmount: Number(depositAmount),
          images,
          categoryId,
          subcategory: subcategory || null,
          vendorId: actualVendorId,
          totalStock: totalStock !== undefined ? Number(totalStock) : 1,
        },
      });

      res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

// Admin/Vendor Update Product
router.put(
  '/:id',
  authMiddleware,
  requireRole(['ADMIN', 'VENDOR']),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
      const existingProduct = await prisma.product.findUnique({ where: { id } });
      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check ownership
      if (req.user!.role === 'VENDOR' && existingProduct.vendorId !== req.user!.vendorProfile?.id) {
        return res.status(403).json({ error: 'Forbidden. You do not own this product.' });
      }

      if (updateData.name) {
        updateData.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      if (updateData.specs && typeof updateData.specs !== 'string') {
        updateData.specs = JSON.stringify(updateData.specs);
      }
      if (updateData.dailyRate) updateData.dailyRate = Number(updateData.dailyRate);
      if (updateData.weeklyRate) updateData.weeklyRate = Number(updateData.weeklyRate);
      if (updateData.depositAmount) updateData.depositAmount = Number(updateData.depositAmount);
      if (updateData.totalStock !== undefined) updateData.totalStock = Number(updateData.totalStock);
      if (updateData.subcategory !== undefined) {
        updateData.subcategory = updateData.subcategory || null;
      }

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
      });

      res.json({ message: 'Product updated successfully', product });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

// Admin/Vendor Delete Product
router.delete(
  '/:id',
  authMiddleware,
  requireRole(['ADMIN', 'VENDOR']),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const existingProduct = await prisma.product.findUnique({ where: { id } });
      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check ownership
      if (req.user!.role === 'VENDOR' && existingProduct.vendorId !== req.user!.vendorProfile?.id) {
        return res.status(403).json({ error: 'Forbidden. You do not own this product.' });
      }

      await prisma.product.delete({ where: { id } });
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  }
);

// Add Blackout Dates
router.post(
  '/:id/blackouts',
  authMiddleware,
  requireRole(['ADMIN', 'VENDOR']),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    try {
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      if (req.user!.role === 'VENDOR' && product.vendorId !== req.user!.vendorProfile?.id) {
        return res.status(403).json({ error: 'Forbidden. You do not own this product.' });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      // Verify availability before blacking out (optional, but good to avoid conflict with active rentals)
      const isFree = await checkProductAvailability(id, start, end);
      if (!isFree.available && isFree.reason?.includes('rented')) {
        return res.status(400).json({ error: `Cannot blackout dates: Product is currently rented during this period.` });
      }

      const blackout = await prisma.productAvailabilityBlackout.create({
        data: {
          productId: id,
          startDate: start,
          endDate: end,
          reason,
        },
      });

      res.status(201).json({ message: 'Blackout dates successfully created', blackout });
    } catch (error) {
      console.error('Create blackout error:', error);
      res.status(500).json({ error: 'Failed to create blackout dates' });
    }
  }
);

// Get Blackout Dates
router.get('/:id/blackouts', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const blackouts = await prisma.productAvailabilityBlackout.findMany({
      where: { productId: id },
      orderBy: { startDate: 'asc' },
    });
    res.json(blackouts);
  } catch (error) {
    console.error('Fetch blackouts error:', error);
    res.status(500).json({ error: 'Failed to fetch blackout dates' });
  }
});

export default router;
