import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const followUpsRouter = Router();
followUpsRouter.use(authenticate);

const createFollowUpSchema = z.object({
  leadId: z.string(),
  followUpDate: z.string().datetime(),
  type: z.enum(['CALL', 'SITE_VISIT', 'WHATSAPP', 'EMAIL', 'NEGOTIATION', 'MEETING']).optional(),
  notes: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().optional(),
});

const updateFollowUpSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'RESCHEDULED', 'CANCELLED']).optional(),
  outcome: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
  type: z.enum(['CALL', 'SITE_VISIT', 'WHATSAPP', 'EMAIL', 'NEGOTIATION', 'MEETING']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().optional(),
});

// GET /follow-ups
followUpsRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      status,
      assignedTo,
      type,
      priority,
      filter,
      projectId,
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(parseInt(limit) || 50, 200);
    const skip = (pageNum - 1) * limitNum;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: Record<string, unknown> = {};

    // Sales employees only see their own follow-ups
    if (req.user?.role === 'SALES_EMPLOYEE') where.assignedToId = req.user.id;
    if (assignedTo) where.assignedToId = assignedTo;
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (status && !filter) where.status = status;

    if (filter === 'today') {
      where.followUpDate = { gte: today, lt: tomorrow };
      where.status = 'PENDING';
    } else if (filter === 'overdue') {
      where.followUpDate = { lt: today };
      where.status = 'PENDING';
    } else if (filter === 'upcoming') {
      where.followUpDate = { gte: tomorrow };
      where.status = 'PENDING';
    } else if (filter === 'completed') {
      where.status = 'COMPLETED';
    }

    if (projectId) {
      where.lead = { interestedProjectId: projectId };
    }

    const [followUps, total] = await Promise.all([
      prisma.followUp.findMany({
        where,
        include: {
          lead: {
            include: {
              interestedProject: { select: { id: true, name: true } },
            },
          },
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { followUpDate: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.followUp.count({ where }),
    ]);

    res.json({ followUps, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
});

// POST /follow-ups
followUpsRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createFollowUpSchema.parse(req.body);
    const followUp = await prisma.followUp.create({
      data: {
        leadId: data.leadId,
        assignedToId: data.assignedToId || req.user!.id,
        followUpDate: new Date(data.followUpDate),
        type: data.type || 'CALL',
        notes: data.notes,
        priority: data.priority || 'MEDIUM',
      },
      include: {
        lead: { select: { id: true, name: true, leadNumber: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // Update lead next follow-up date
    await prisma.lead.update({
      where: { id: data.leadId },
      data: { nextFollowUp: new Date(data.followUpDate) },
    });

    res.status(201).json({ followUp });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to create follow-up' });
  }
});

// PATCH /follow-ups/:id
followUpsRouter.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = updateFollowUpSchema.parse(req.body);
    const followUp = await prisma.followUp.update({
      where: { id: req.params.id },
      data: {
        ...data,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
      },
      include: {
        lead: { select: { id: true, name: true, leadNumber: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });
    res.json({ followUp });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update follow-up' });
  }
});

// DELETE /follow-ups/:id
followUpsRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.followUp.delete({ where: { id: req.params.id } });
    res.json({ message: 'Follow-up deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete follow-up' });
  }
});
