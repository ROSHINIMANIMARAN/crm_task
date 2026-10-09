import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const leadsRouter = Router();
leadsRouter.use(authenticate);

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  alternatePhone: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
  source: z.enum(['PORTAL', 'REFERRAL', 'CHANNEL_PARTNER', 'DIRECT', 'SITE_WALK_IN', 'DIGITAL_CAMPAIGN', 'NRI_REFERRAL']).optional(),
  budget: z.string().optional().nullable(),
  preferredLocation: z.string().optional().nullable(),
  propertyType: z.enum(['TWO_BHK', 'THREE_BHK', 'THREE_BHK_LUXURY', 'FOUR_BHK', 'PENTHOUSE', 'VILLA', 'PLOT']).optional().nullable(),
  stage: z.enum(['NEW', 'CONTACTED', 'SITE_VISIT', 'INTERESTED', 'NEGOTIATION', 'BOOKED', 'LOST']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().optional().nullable(),
  interestedProjectId: z.string().optional().nullable(),
  nextFollowUp: z.string().datetime().optional().nullable(),
  interactionObjective: z.string().optional().nullable(),
});

async function generateLeadNumber(): Promise<string> {
  const count = await prisma.lead.count();
  return `LD-${String(count + 1001).padStart(4, '0')}`;
}

// GET /leads
leadsRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      search,
      stage,
      assignedTo,
      priority,
      page = '1',
      limit = '20',
      projectId,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};

    // Sales employees only see assigned leads
    if (req.user?.role === 'SALES_EMPLOYEE') {
      where.assignedToId = req.user.id;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { leadNumber: { contains: search, mode: 'insensitive' } },
        { organization: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (stage) where.stage = stage;
    if (assignedTo) where.assignedToId = assignedTo;
    if (priority) where.priority = priority;
    if (projectId) where.interestedProjectId = projectId;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, designation: true },
          },
          interestedProject: {
            select: { id: true, name: true, location: true },
          },
          _count: { select: { notes: true, followUps: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      leads,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('GET /leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// POST /leads
leadsRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = leadSchema.parse(req.body);
    const leadNumber = await generateLeadNumber();

    const lead = await prisma.lead.create({
      data: {
        ...data,
        leadNumber,
        email: data.email || undefined,
        nextFollowUp: data.nextFollowUp ? new Date(data.nextFollowUp) : undefined,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        interestedProject: { select: { id: true, name: true } },
      },
    });

    await prisma.activity.create({
      data: {
        leadId: lead.id,
        userId: req.user!.id,
        action: 'LEAD_CREATED',
        description: `Lead created by ${req.user!.name}`,
      },
    });

    res.status(201).json({ lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('POST /leads error:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// GET /leads/:id
leadsRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, designation: true } },
        interestedProject: { select: { id: true, name: true, location: true } },
        notes: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        followUps: {
          include: { assignedTo: { select: { id: true, name: true } } },
          orderBy: { followUpDate: 'asc' },
        },
        bookings: {
          include: {
            unit: {
              include: { building: { include: { project: true } } },
            },
            salesEmployee: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    // Sales employees can only view their assigned leads
    if (req.user?.role === 'SALES_EMPLOYEE' && lead.assignedToId !== req.user.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ lead });
  } catch (error) {
    console.error('GET /leads/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// PATCH /leads/:id
leadsRouter.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existingLead = await prisma.lead.findUnique({ where: { id } });
    if (!existingLead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    if (req.user?.role === 'SALES_EMPLOYEE' && existingLead.assignedToId !== req.user.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const data = leadSchema.partial().parse(req.body);
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...data,
        email: data.email || undefined,
        nextFollowUp: data.nextFollowUp ? new Date(data.nextFollowUp) : undefined,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        interestedProject: { select: { id: true, name: true } },
      },
    });

    // Log stage change activity
    if (data.stage && data.stage !== existingLead.stage) {
      await prisma.activity.create({
        data: {
          leadId: id,
          userId: req.user!.id,
          action: 'STAGE_CHANGED',
          description: `Stage changed from ${existingLead.stage} to ${data.stage} by ${req.user!.name}`,
        },
      });
    }

    // Log assignment change
    if (data.assignedToId !== undefined && data.assignedToId !== existingLead.assignedToId) {
      await prisma.activity.create({
        data: {
          leadId: id,
          userId: req.user!.id,
          action: 'LEAD_ASSIGNED',
          description: `Lead reassigned by ${req.user!.name}`,
        },
      });
    }

    res.json({ lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('PATCH /leads/:id error:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// DELETE /leads/:id - Admin only
leadsRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('DELETE /leads/:id error:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// PATCH /leads/:id/stage
leadsRouter.patch('/:id/stage', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { stage } = z
      .object({ stage: z.enum(['NEW', 'CONTACTED', 'SITE_VISIT', 'INTERESTED', 'NEGOTIATION', 'BOOKED', 'LOST']) })
      .parse(req.body);

    const existingLead = await prisma.lead.findUnique({ where: { id } });
    if (!existingLead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    const lead = await prisma.lead.update({
      where: { id },
      data: { stage, lastContacted: new Date() },
    });

    await prisma.activity.create({
      data: {
        leadId: id,
        userId: req.user!.id,
        action: 'STAGE_CHANGED',
        description: `Stage changed from ${existingLead.stage} to ${stage} by ${req.user!.name}`,
      },
    });

    res.json({ lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update stage' });
  }
});

// POST /leads/:id/notes
leadsRouter.post('/:id/notes', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, tags = [] } = z
      .object({ content: z.string().min(1, 'Note content is required'), tags: z.array(z.string()).optional() })
      .parse(req.body);

    const note = await prisma.note.create({
      data: { leadId: id, userId: req.user!.id, content, tags },
      include: { user: { select: { id: true, name: true } } },
    });

    await prisma.activity.create({
      data: {
        leadId: id,
        userId: req.user!.id,
        action: 'NOTE_ADDED',
        description: `Note added by ${req.user!.name}`,
      },
    });

    res.status(201).json({ note });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('POST /leads/:id/notes error:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// POST /leads/:id/follow-ups
leadsRouter.post('/:id/follow-ups', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const schema = z.object({
      followUpDate: z.string().datetime(),
      type: z.enum(['CALL', 'SITE_VISIT', 'WHATSAPP', 'EMAIL', 'NEGOTIATION', 'MEETING']).optional(),
      notes: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      assignedToId: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const followUp = await prisma.followUp.create({
      data: {
        leadId: id,
        assignedToId: data.assignedToId || req.user!.id,
        followUpDate: new Date(data.followUpDate),
        type: data.type || 'CALL',
        notes: data.notes,
        priority: data.priority || 'MEDIUM',
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true, leadNumber: true } },
      },
    });

    // Update lead next follow-up date
    await prisma.lead.update({
      where: { id },
      data: { nextFollowUp: new Date(data.followUpDate) },
    });

    await prisma.activity.create({
      data: {
        leadId: id,
        userId: req.user!.id,
        action: 'FOLLOWUP_CREATED',
        description: `Follow-up scheduled by ${req.user!.name} for ${new Date(data.followUpDate).toLocaleDateString()}`,
      },
    });

    res.status(201).json({ followUp });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('POST /leads/:id/follow-ups error:', error);
    res.status(500).json({ error: 'Failed to create follow-up' });
  }
});

// GET /leads/:id/activities
leadsRouter.get('/:id/activities', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activities = await prisma.activity.findMany({
      where: { leadId: req.params.id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ activities });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});
