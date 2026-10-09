import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const bookingsRouter = Router();
bookingsRouter.use(authenticate);

const bookingSchema = z.object({
  leadId: z.string(),
  unitId: z.string(),
  bookingAmount: z.number().positive(),
  paymentMethod: z.enum(['RTGS_NEFT', 'CHEQUE_DD', 'PAYMENT_LINK', 'CORPORATE_UPI']),
  bankUtr: z.string().optional(),
  bankName: z.string().optional(),
  notes: z.string().optional(),
  bookingDate: z.string().optional(),
});

async function generateBookingNumber(): Promise<string> {
  const count = await prisma.booking.count();
  return `BK-${String(count + 1001).padStart(4, '0')}`;
}

// GET /bookings
bookingsRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, page = '1', limit = '20', projectId } = req.query as Record<string, string>;
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (req.user?.role === 'SALES_EMPLOYEE') where.salesEmployeeId = req.user.id;
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (search) {
      where.OR = [
        { lead: { name: { contains: search, mode: 'insensitive' } } },
        { bookingNumber: { contains: search, mode: 'insensitive' } },
        { unit: { unitNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          lead: { select: { id: true, name: true, phone: true, leadNumber: true, designation: true, organization: true } },
          unit: { include: { building: { include: { project: { select: { id: true, name: true } } } } } },
          project: { select: { id: true, name: true, location: true } },
          salesEmployee: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({ bookings, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST /bookings - ATOMIC booking with transaction to prevent duplicates
bookingsRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = bookingSchema.parse(req.body);

    const booking = await prisma.$transaction(async (tx) => {
      // 1. Check unit exists and is AVAILABLE (this is the critical check)
      const unit = await tx.unit.findUnique({
        where: { id: data.unitId },
        include: { building: { include: { project: true } } },
      });

      if (!unit) throw new Error('UNIT_NOT_FOUND');
      if (unit.status !== 'AVAILABLE') throw new Error('UNIT_NOT_AVAILABLE');

      // 2. Mark unit as BOOKED immediately within transaction
      await tx.unit.update({
        where: { id: data.unitId },
        data: { status: 'BOOKED' },
      });

      // 3. Generate booking number
      const existingCount = await tx.booking.count();
      const bookingNumber = `BK-${String(existingCount + 1001).padStart(4, '0')}`;

      // 4. Create the booking record
      const newBooking = await tx.booking.create({
        data: {
          bookingNumber,
          leadId: data.leadId,
          unitId: data.unitId,
          projectId: unit.building.project.id,
          salesEmployeeId: req.user!.id,
          bookingAmount: data.bookingAmount,
          totalPrice: unit.price + (unit.floorRisePremium || 0) + (unit.parkingPrice || 0),
          paymentMethod: data.paymentMethod,
          bankUtr: data.bankUtr,
          bankName: data.bankName,
          notes: data.notes,
          bookingDate: data.bookingDate ? new Date(data.bookingDate) : new Date(),
          status: 'CONFIRMED',
        },
        include: {
          lead: { select: { id: true, name: true, phone: true, leadNumber: true } },
          unit: { include: { building: { include: { project: true } } } },
          project: { select: { id: true, name: true } },
          salesEmployee: { select: { id: true, name: true } },
        },
      });

      // 5. Update lead stage to BOOKED
      await tx.lead.update({
        where: { id: data.leadId },
        data: { stage: 'BOOKED', lastContacted: new Date() },
      });

      // 6. Log activity
      await tx.activity.create({
        data: {
          leadId: data.leadId,
          userId: req.user!.id,
          action: 'BOOKING_CREATED',
          description: `Booking ${bookingNumber} created for unit ${unit.unitNumber} by ${req.user!.name}`,
        },
      });

      return newBooking;
    });

    res.status(201).json({ booking });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNIT_NOT_FOUND') {
      res.status(404).json({ error: 'Unit not found' });
      return;
    }
    if (err.message === 'UNIT_NOT_AVAILABLE') {
      res.status(409).json({
        error: 'Unit no longer available',
        message: 'This unit was booked by another user. Please select a different unit.',
      });
      return;
    }
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('POST /bookings error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET /bookings/:id
bookingsRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        lead: true,
        unit: { include: { building: { include: { project: true } } } },
        project: true,
        salesEmployee: { select: { id: true, name: true, designation: true, phone: true } },
      },
    });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json({ booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// PATCH /bookings/:id
bookingsRouter.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = req.body.status as string | undefined
    const notes = req.body.notes as string | undefined
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        ...(status ? { status: status as 'PENDING' | 'CONFIRMED' | 'CANCELLED' } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });
    res.json({ booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});
