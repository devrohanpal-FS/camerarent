import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

function parseCrewSpecs(specsStr: string | null | undefined) {
  if (!specsStr) return {};
  try {
    return JSON.parse(specsStr);
  } catch {
    return {};
  }
}

function formatCrewMember(product: any) {
  const specs = parseCrewSpecs(product.specs);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    role: specs.Role || product.name,
    department: specs.Department || (
      product.name.toLowerCase().includes('dop') || product.name.toLowerCase().includes('camera') ? 'Camera' :
      product.name.toLowerCase().includes('light') ? 'Lighting' :
      product.name.toLowerCase().includes('sound') ? 'Audio' :
      product.name.toLowerCase().includes('director') || product.name.toLowerCase().includes('producer') ? 'Direction & Production' :
      'Studio & Support'
    ),
    dailyRate: product.dailyRate,
    priceOnRequest: specs.Rate === 'Price on Request' || product.dailyRate === 0 || specs.PriceOnRequest === true,
    shiftHours: specs.ShiftHours ? Number(specs.ShiftHours) : 8,
    experience: specs.Experience || specs['Series Order'] || 'Experienced Professional',
    phone: specs.Phone || '+91 98110 00000',
    images: product.images,
    description: product.description,
    totalStock: product.totalStock,
    isAvailable: product.totalStock > 0,
    categoryId: product.categoryId,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: 'manpower' },
          { name: { contains: 'Crew' } },
          { name: { contains: 'Manpower' } },
        ]
      }
    });

    const whereClause: any = category
      ? { categoryId: category.id }
      : {
          OR: [
            { subcategory: { contains: 'Crew' } },
            { name: { contains: 'DOP' } },
            { name: { contains: 'Camera Assistant' } },
            { name: { contains: 'Sound' } },
            { name: { contains: 'Light' } },
          ]
        };

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
    });

    const crewList = products.map(formatCrewMember);
    res.json(crewList);
  } catch (error: any) {
    console.error('Fetch crew members error:', error);
    res.status(500).json({ error: 'Failed to fetch crew members', message: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Crew member not found' });
    }

    res.json(formatCrewMember(product));
  } catch (error: any) {
    console.error('Fetch single crew member error:', error);
    res.status(500).json({ error: 'Failed to fetch crew member', message: error.message });
  }
});

router.post(
  '/',
  authMiddleware,
  requireRole(['ADMIN', 'VENDOR']),
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        role,
        department,
        dailyRate,
        priceOnRequest,
        shiftHours,
        experience,
        phone,
        images,
        description,
        totalStock,
      } = req.body;

      if (!name || !role) {
        return res.status(400).json({ error: 'Name and Role are required fields' });
      }

      let category = await prisma.category.findFirst({
        where: {
          OR: [
            { slug: 'manpower' },
            { name: 'Manpower / Production Crew' }
          ]
        }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: 'Manpower / Production Crew',
            slug: 'manpower',
            description: 'Professional film & production crew members and technicians.'
          }
        });
      }

      let vendor = await prisma.vendor.findFirst({
        where: { isActive: true },
      });

      if (!vendor) {
        const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (user) {
          vendor = await prisma.vendor.create({
            data: {
              name: 'CameraRent Pro Crew',
              email: `crew-${Date.now()}@camerarent.com`,
              userId: user.id,
            }
          });
        }
      }

      const cleanSlugBase = (name + '-' + (role || 'crew'))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const uniqueSlug = `${cleanSlugBase}-${Date.now().toString().slice(-4)}`;

      const specsObj = {
        Role: role || name,
        Department: department || 'Production Crew',
        Rate: priceOnRequest ? 'Price on Request' : `₹${dailyRate || 0} / Shift`,
        PriceOnRequest: !!priceOnRequest,
        ShiftHours: shiftHours ? Number(shiftHours) : 8,
        Experience: experience || 'Experienced On-Set Crew',
        Phone: phone || '+91 98110 00000',
        'Service Category': 'Manpower / Production Crew',
      };

      const product = await prisma.product.create({
        data: {
          name,
          slug: uniqueSlug,
          description: description || `Professional ${role} for feature films, commercials, and digital productions.`,
          specs: JSON.stringify(specsObj),
          dailyRate: priceOnRequest ? 0 : Number(dailyRate || 0),
          weeklyRate: priceOnRequest ? 0 : Number(dailyRate || 0) * 6,
          depositAmount: 0,
          images: images || '/images/crew/crew-dop.jpg',
          categoryId: category.id,
          subcategory: 'Manpower / Production Crew',
          vendorId: vendor?.id || '',
          totalStock: totalStock !== undefined ? Number(totalStock) : 1,
        }
      });

      res.status(201).json({
        message: 'Crew member created successfully',
        crew: formatCrewMember(product),
      });
    } catch (error: any) {
      console.error('Create crew member error:', error);
      res.status(500).json({ error: 'Failed to create crew member', message: error.message });
    }
  }
);

router.put(
  '/:id',
  authMiddleware,
  requireRole(['ADMIN', 'VENDOR']),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Crew member not found' });
      }

      const {
        name,
        role,
        department,
        dailyRate,
        priceOnRequest,
        shiftHours,
        experience,
        phone,
        images,
        description,
        totalStock,
      } = req.body;

      const currentSpecs = parseCrewSpecs(existing.specs);
      const updatedSpecs = {
        ...currentSpecs,
        Role: role !== undefined ? role : currentSpecs.Role,
        Department: department !== undefined ? department : currentSpecs.Department,
        Rate: priceOnRequest ? 'Price on Request' : (dailyRate !== undefined ? `₹${dailyRate} / Shift` : currentSpecs.Rate),
        PriceOnRequest: priceOnRequest !== undefined ? !!priceOnRequest : currentSpecs.PriceOnRequest,
        ShiftHours: shiftHours !== undefined ? Number(shiftHours) : (currentSpecs.ShiftHours || 8),
        Experience: experience !== undefined ? experience : currentSpecs.Experience,
        Phone: phone !== undefined ? phone : currentSpecs.Phone,
      };

      const updated = await prisma.product.update({
        where: { id },
        data: {
          name: name || existing.name,
          images: images || existing.images,
          description: description !== undefined ? description : existing.description,
          dailyRate: priceOnRequest ? 0 : (dailyRate !== undefined ? Number(dailyRate) : existing.dailyRate),
          weeklyRate: priceOnRequest ? 0 : (dailyRate !== undefined ? Number(dailyRate) * 6 : existing.weeklyRate),
          specs: JSON.stringify(updatedSpecs),
          totalStock: totalStock !== undefined ? Number(totalStock) : existing.totalStock,
        }
      });

      res.json({
        message: 'Crew member updated successfully',
        crew: formatCrewMember(updated),
      });
    } catch (error: any) {
      console.error('Update crew member error:', error);
      res.status(500).json({ error: 'Failed to update crew member', message: error.message });
    }
  }
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole(['ADMIN']),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Crew member not found' });
      }

      await prisma.cartItem.deleteMany({ where: { productId: id } });
      await prisma.productAvailabilityBlackout.deleteMany({ where: { productId: id } });

      await prisma.product.delete({ where: { id } });

      res.json({ message: 'Crew member deleted successfully', id });
    } catch (error: any) {
      console.error('Delete crew member error:', error);
      res.status(500).json({ error: 'Failed to delete crew member', message: error.message });
    }
  }
);

export default router;
