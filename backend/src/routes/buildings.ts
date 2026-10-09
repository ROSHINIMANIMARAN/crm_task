import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

export const buildingsRouter = Router();
buildingsRouter.use(authenticate);

const buildingSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  floors: z.number().int().min(1),
  totalUnits: z.number().int().min(0).optional(),
});

buildingsRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query as { projectId?: string };
    const buildings = await prisma.building.findMany({
      where: projectId ? { projectId } : {},
      include: {
        units: { select: { status: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ buildings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch buildings' });
  }
});

buildingsRouter.post('/', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = buildingSchema.parse(req.body);
    const building = await prisma.building.create({
      data,
      include: { project: { select: { id: true, name: true } } },
    });
    res.status(201).json({ building });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to create building' });
  }
});

buildingsRouter.patch('/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = buildingSchema.partial().omit({ projectId: true }).parse(req.body);
    const building = await prisma.building.update({ where: { id: req.params.id }, data });
    res.json({ building });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update building' });
  }
});

buildingsRouter.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.building.delete({ where: { id: req.params.id } });
    res.json({ message: 'Building deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete building' });
  }
});
