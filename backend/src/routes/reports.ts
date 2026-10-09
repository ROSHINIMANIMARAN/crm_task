import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

export const reportsRouter = Router();
reportsRouter.use(authenticate);
reportsRouter.use(requireAdmin);

reportsRouter.get('/overview', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalLeads, totalBookings, revenueData, totalUnits, availableUnits] = await Promise.all([
      prisma.lead.count(),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.aggregate({ where: { status: 'CONFIRMED' }, _sum: { totalPrice: true } }),
      prisma.unit.count(),
      prisma.unit.count({ where: { status: 'AVAILABLE' } }),
    ]);

    const stageDistribution = await prisma.lead.groupBy({
      by: ['stage'],
      _count: { id: true },
    });

    const sourceDistribution = await prisma.lead.groupBy({
      by: ['source'],
      _count: { id: true },
    });

    const allBookings = await prisma.booking.findMany({
      where: { status: 'CONFIRMED' },
      select: { createdAt: true, totalPrice: true, bookingAmount: true, salesEmployeeId: true },
      orderBy: { createdAt: 'asc' },
    });

    const monthlyMap: Record<string, { count: number; value: number }> = {};
    allBookings.forEach((b) => {
      const key = b.createdAt.toISOString().substring(0, 7);
      if (!monthlyMap[key]) monthlyMap[key] = { count: 0, value: 0 };
      monthlyMap[key].count += 1;
      monthlyMap[key].value += b.totalPrice;
    });

    const salesTeam = await prisma.user.findMany({
      where: { role: 'SALES_EMPLOYEE', status: 'ACTIVE' },
      include: {
        bookings: { where: { status: 'CONFIRMED' }, select: { totalPrice: true } },
        assignedLeads: { select: { stage: true } },
      },
    });

    res.json({
      summary: {
        totalLeads,
        totalBookings,
        totalRevenue: revenueData._sum.totalPrice || 0,
        totalUnits,
        availableUnits,
        conversionRate:
          totalLeads > 0 ? Math.round((totalBookings / totalLeads) * 100) : 0,
      },
      stageDistribution: stageDistribution.map((s) => ({ stage: s.stage, count: s._count.id })),
      sourceDistribution: sourceDistribution.map((s) => ({ source: s.source, count: s._count.id })),
      monthlyBookings: Object.entries(monthlyMap).map(([month, data]) => ({ month, ...data })),
      salesTeamPerformance: salesTeam.map((u) => ({
        id: u.id,
        name: u.name,
        designation: u.designation,
        deals: u.bookings.length,
        revenue: u.bookings.reduce((sum, b) => sum + b.totalPrice, 0),
        leadsAssigned: u.assignedLeads.length,
        conversion:
          u.assignedLeads.length > 0
            ? Math.round((u.bookings.length / u.assignedLeads.length) * 100)
            : 0,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});
