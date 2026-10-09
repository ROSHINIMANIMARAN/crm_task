import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

export const usersRouter = Router();
usersRouter.use(authenticate);

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'SALES_EMPLOYEE']).default('SALES_EMPLOYEE'),
  designation: z.string().optional(),
  phone: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  designation: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  role: z.enum(['ADMIN', 'SALES_EMPLOYEE']).optional(),
});

// GET /users - Admin only
usersRouter.get('/', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        phone: true,
        status: true,
        createdAt: true,
        _count: { select: { assignedLeads: true, bookings: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /users/sales - All active users (for assignment dropdowns)
usersRouter.get('/sales', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, email: true, role: true, designation: true },
      orderBy: { name: 'asc' },
    });
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /users - Admin only
usersRouter.post('/', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createUserSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ error: 'A user with this email already exists' });
      return;
    }
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role,
        designation: data.designation,
        phone: data.phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /users/:id - Admin only
usersRouter.patch('/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        phone: true,
        status: true,
      },
    });
    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /users/:id - Admin only (soft delete - deactivate)
usersRouter.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (id === req.user?.id) {
      res.status(400).json({ error: 'Cannot deactivate your own account' });
      return;
    }
    await prisma.user.update({ where: { id }, data: { status: 'INACTIVE' } });
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});
