import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSuperadminDashboard() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalTenants,
      activeTenants,
      totalCustomers,
      todayAppointments,
      monthlyAppointments,
      totalRevenue,
      monthlyRevenue,
      recentAppointments,
      topTenants,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.appointment.count({
        where: { date: { gte: today }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      }),
      this.prisma.appointment.count({
        where: { createdAt: { gte: monthStart }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'SUCCESS', paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.appointment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { name: true } },
          customer: { select: { firstName: true, lastName: true } },
          service: { select: { name: true, price: true } },
        },
      }),
      this.prisma.tenant.findMany({
        take: 5,
        where: { isActive: true },
        include: { _count: { select: { appointments: true } } },
        orderBy: { appointments: { _count: 'desc' } },
      }),
    ]);

    return {
      kpis: {
        totalTenants,
        activeTenants,
        totalCustomers,
        todayAppointments,
        monthlyAppointments,
        totalRevenue: totalRevenue._sum.amount || 0,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
      },
      recentAppointments,
      topTenants,
    };
  }

  async getStoreDashboard(tenantId: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCustomers,
      todayAppointments,
      weekAppointments,
      monthRevenue,
      totalRevenue,
      upcomingAppointments,
      topServices,
      employeeStats,
    ] = await Promise.all([
      this.prisma.user.count({ where: { tenantId, role: 'CUSTOMER' } }),
      this.prisma.appointment.count({
        where: { tenantId, date: { gte: today, lt: tomorrow }, status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] } },
      }),
      this.prisma.appointment.count({
        where: { tenantId, date: { gte: weekStart }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      }),
      this.prisma.payment.aggregate({
        where: { tenantId, status: 'SUCCESS', paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { tenantId, status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      this.prisma.appointment.findMany({
        where: { tenantId, date: { gte: today }, status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] } },
        take: 10,
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        include: {
          customer: { select: { firstName: true, lastName: true, phone: true } },
          employee: { select: { firstName: true, lastName: true } },
          service: { select: { name: true, price: true, duration: true } },
        },
      }),
      this.prisma.appointment.groupBy({
        by: ['serviceId'],
        where: { tenantId, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _count: true,
        orderBy: { _count: { serviceId: 'desc' } },
        take: 5,
      }),
      this.prisma.employee.findMany({
        where: { tenantId, isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          _count: { select: { appointments: true } },
        },
      }),
    ]);

    // Enrich top services with names
    const serviceIds = topServices.map((s) => s.serviceId);
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    });
    const enrichedTopServices = topServices.map((ts) => ({
      ...ts,
      serviceName: services.find((s) => s.id === ts.serviceId)?.name || 'Bilinmeyen',
    }));

    return {
      kpis: {
        totalCustomers,
        todayAppointments,
        weekAppointments,
        monthRevenue: monthRevenue._sum.amount || 0,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
      upcomingAppointments,
      topServices: enrichedTopServices,
      employeeStats,
    };
  }

  async getAdvancedAnalytics(tenantId: string, range: string = '30d') {
    // Determine date range (simplified for 30d)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // 1. Revenue over time (Grouped by Day)
    const payments = await this.prisma.payment.findMany({
      where: {
        tenantId,
        status: 'SUCCESS',
        createdAt: { gte: startDate }
      },
      select: { amount: true, createdAt: true }
    });

    const revenueMap = new Map<string, number>();
    payments.forEach(p => {
      const dateStr = p.createdAt.toISOString().split('T')[0];
      revenueMap.set(dateStr, (revenueMap.get(dateStr) || 0) + Number(p.amount));
    });

    const revenueData = Array.from(revenueMap.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 2. Top Services
    const appointments = await this.prisma.appointment.findMany({
      where: { tenantId, status: 'COMPLETED', date: { gte: startDate } },
      include: { service: true }
    });

    const serviceMap = new Map<string, { name: string, count: number, revenue: number }>();
    appointments.forEach(app => {
      const srv = serviceMap.get(app.serviceId) || { name: app.service.name, count: 0, revenue: 0 };
      srv.count += 1;
      srv.revenue += Number(app.totalPrice);
      serviceMap.set(app.serviceId, srv);
    });

    const topServices = Array.from(serviceMap.values()).sort((a, b) => b.count - a.count).slice(0, 5);

    return { revenueData, topServices };
  }
}
