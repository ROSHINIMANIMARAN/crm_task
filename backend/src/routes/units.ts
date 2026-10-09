import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

export const unitsRouter = Router();
unitsRouter.use(authenticate);

const unitSchema = z.object({
  buildingId: z.string(),
  unitNumber: z.string().min(1),
  type: z.enum(['TWO_BHK', 'THREE_BHK', 'THREE_BHK_LUXURY', 'FOUR_BHK', 'PENTHOUSE', 'VILLA', 'PLOT']),
  floor: z.number().int(),
  area: z.number().positive(),
  carpetArea: z.number().positive().optional(),
  price: z.number().positive(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'BOOKED', 'BLOCKED']).optional(),
  orientation: z.string().optional(),
  floorRisePremium: z.number().optional(),
  parkingPrice: z.number().optional(),
  isReraCompliant: z.boolean().optional(),
});

// GET /units
unitsRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { buildingId, projectId, status, type, minPrice, maxPrice } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (buildingId) where.buildingId = buildingId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter.gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
      where.price = priceFilter;
    }
    if (projectId) {
      where.building = { projectId };
    }

    const units = await prisma.unit.findMany({
      where,
      include: {
        building: { include: { project: { select: { id: true, name: true } } } },
      },
      orderBy: [{ floor: 'asc' }, { unitNumber: 'asc' }],
    });
    res.json({ units });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

// GET /units/:id
unitsRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const unit = await prisma.unit.findUnique({
      where: { id: req.params.id },
      include: {
        building: { include: { project: true } },
        bookings: {
          include: {
            lead: { select: { id: true, name: true, phone: true } },
            salesEmployee: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!unit) {
      res.status(404).json({ error: 'Unit not found' });
      return;
    }
    res.json({ unit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unit' });
  }
});

// POST /units - Admin only
unitsRouter.post('/', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = unitSchema.parse(req.body);
    const unit = await prisma.unit.create({
      data,
      include: { building: { include: { project: { select: { id: true, name: true } } } } },
    });
    res.status(201).json({ unit });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

// PATCH /units/:id - Admin only
unitsRouter.patch('/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = unitSchema.partial().omit({ buildingId: true }).parse(req.body);
    const unit = await prisma.unit.update({ where: { id: req.params.id }, data });
    res.json({ unit });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update unit' });
  }
});

// POST /units/bulk - Admin only - Bulk create units
unitsRouter.post('/bulk', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { units } = z.object({ units: z.array(unitSchema) }).parse(req.body);
    const created = await prisma.unit.createMany({ data: units, skipDuplicates: true });
    res.status(201).json({ count: created.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to bulk create units' });
  }
});
