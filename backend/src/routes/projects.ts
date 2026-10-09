import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

export const projectsRouter = Router();
projectsRouter.use(authenticate);

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'READY', 'UPCOMING']).optional(),
  reraNumber: z.string().optional(),
  totalArea: z.string().optional(),
  handoverDate: z.string().optional(),
  corridorDistance: z.string().optional(),
});

// GET /projects
projectsRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        buildings: {
          include: {
            units: { select: { status: true } },
          },
        },
        _count: { select: { leads: true, bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const projectsWithStats = projects.map((p) => {
      const allUnits = p.buildings.flatMap((b) => b.units);
      const totalUnits = allUnits.length;
      const availableUnits = allUnits.filter((u) => u.status === 'AVAILABLE').length;
      const bookedUnits = allUnits.filter((u) => u.status === 'BOOKED').length;
      const reservedUnits = allUnits.filter((u) => u.status === 'RESERVED').length;
      return { ...p, totalUnits, availableUnits, bookedUnits, reservedUnits, absorbedUnits: bookedUnits };
    });

    res.json({ projects: projectsWithStats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /projects/:id
projectsRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        buildings: {
          include: {
            units: { orderBy: [{ floor: 'asc' }, { unitNumber: 'asc' }] },
          },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /projects - Admin only
projectsRouter.post('/', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = projectSchema.parse(req.body);
    const project = await prisma.project.create({ data });
    res.status(201).json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PATCH /projects/:id - Admin only
projectsRouter.patch('/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = projectSchema.partial().parse(req.body);
    const project = await prisma.project.update({ where: { id: req.params.id }, data });
    res.json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /projects/:id - Admin only
projectsRouter.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});
