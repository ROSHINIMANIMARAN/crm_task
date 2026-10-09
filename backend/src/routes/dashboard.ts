import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isAdmin = req.user?.role === 'ADMIN';
    const userFilter = isAdmin ? {} : { assignedToId: req.user!.id };
    const bookingFilter = isAdmin ? {} : { salesEmployeeId: req.user!.id };
    const followUpFilter = isAdmin ? {} : { assignedToId: req.user!.id };

    const [
      totalLeads,
      newLeads,
      siteVisits,
      interested,
      inNegotiation,
      bookings,
      availableUnits,
      followUpsDueToday,
      overdueFollowUps,
    ] = await Promise.all([
      prisma.lead.count({ where: userFilter }),
      prisma.lead.count({ where: { ...userFilter, stage: 'NEW' } }),
      prisma.lead.count({ where: { ...userFilter, stage: 'SITE_VISIT' } }),
      prisma.lead.count({ where: { ...userFilter, stage: 'INTERESTED' } }),
      prisma.lead.count({ where: { ...userFilter, stage: 'NEGOTIATION' } }),
      prisma.booking.count({ where: bookingFilter }),
      prisma.unit.count({ where: { status: 'AVAILABLE' } }),
      prisma.followUp.count({
        where: { ...followUpFilter, followUpDate: { gte: today, lt: tomorrow }, status: 'PENDING' },
      }),
      prisma.followUp.count({
        where: { ...followUpFilter, followUpDate: { lt: today }, status: 'PENDING' },
      }),
    ]);

    // Lead funnel stage counts
    const stageCounts = await prisma.lead.groupBy({
      by: ['stage'],
      where: userFilter,
      _count: { id: true },
    });

    // Source distribution
    const sourceCounts = await prisma.lead.groupBy({
      by: ['source'],
      where: userFilter,
      _count: { id: true },
    });

    // Monthly bookings (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentBookings = await prisma.booking.findMany({
      where: { ...bookingFilter, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, totalPrice: true, bookingAmount: true },
      orderBy: { createdAt: 'asc' },
    });

    // Today's follow-ups with detail
    const todayFollowUps = await prisma.followUp.findMany({
      where: {
        ...followUpFilter,
        followUpDate: { gte: today, lt: tomorrow },
        status: 'PENDING',
      },
      include: {
        lead: {
          include: { interestedProject: { select: { id: true, name: true } } },
        },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { followUpDate: 'asc' },
      take: 10,
    });

    // Recent bookings detail
    const recentBookingsDetail = await prisma.booking.findMany({
      where: bookingFilter,
      include: {
        lead: {
          select: { id: true, name: true, phone: true, designation: true, organization: true, leadNumber: true },
        },
        unit: { include: { building: { include: { project: { select: { id: true, name: true } } } } } },
        project: { select: { id: true, name: true } },
        salesEmployee: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Sales performance leaderboard
    const salesPerformance = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      include: {
        bookings: { select: { totalPrice: true }, where: { status: 'CONFIRMED' } },
        assignedLeads: { select: { stage: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Inventory by project
    const projects = await prisma.project.findMany({
      include: {
        buildings: { include: { units: { select: { status: true } } } },
      },
    });

    const inventoryByProject = projects.map((p) => {
      const allUnits = p.buildings.flatMap((b) => b.units);
      return {
        projectId: p.id,
        projectName: p.name,
        total: allUnits.length,
        available: allUnits.filter((u) => u.status === 'AVAILABLE').length,
        booked: allUnits.filter((u) => u.status === 'BOOKED').length,
        reserved: allUnits.filter((u) => u.status === 'RESERVED').length,
      };
    });

    // Monthly aggregation
    const monthlyMap: Record<string, { count: number; value: number }> = {};
    recentBookings.forEach((b) => {
      const key = b.createdAt.toISOString().substring(0, 7);
      if (!monthlyMap[key]) monthlyMap[key] = { count: 0, value: 0 };
      monthlyMap[key].count += 1;
      monthlyMap[key].value += b.totalPrice;
    });
    const monthlyBookings = Object.entries(monthlyMap).map(([month, data]) => ({ month, ...data }));

    res.json({
      stats: {
        totalLeads,
        newLeads,
        siteVisits,
        interested,
        inNegotiation,
        bookings,
        availableUnits,
        followUpsDueToday,
        overdueFollowUps,
      },
      stageCounts: stageCounts.map((s) => ({ stage: s.stage, count: s._count.id })),
      sourceCounts: sourceCounts.map((s) => ({ source: s.source, count: s._count.id })),
      monthlyBookings,
      todayFollowUps,
      recentBookingsDetail,
      salesPerformance: salesPerformance
        .sort((a, b) => b.bookings.length - a.bookings.length)
        .map((u) => ({
          id: u.id,
          name: u.name,
          designation: u.designation,
          deals: u.bookings.length,
          grossValue: u.bookings.reduce((sum, b) => sum + b.totalPrice, 0),
          conversion:
            u.assignedLeads.length > 0
              ? Math.round((u.bookings.length / u.assignedLeads.length) * 100)
              : 0,
        })),
      inventoryByProject,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});
