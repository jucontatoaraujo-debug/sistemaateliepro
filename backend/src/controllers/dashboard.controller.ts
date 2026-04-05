import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getDashboard = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalClients,
    totalOrders,
    ordersThisMonth,
    ordersLastMonth,
    revenueThisMonth,
    revenueLastMonth,
    ordersByStatus,
    artsByStatus,
    productionQueue,
    overdueOrders,
    recentOrders,
    topClients,
    revenueChart,
  ] = await Promise.all([
    // Total de clientes ativos
    prisma.client.count({ where: { tenantId, isActive: true } }),

    // Total de pedidos
    prisma.order.count({ where: { tenantId } }),

    // Pedidos este mês
    prisma.order.count({
      where: { tenantId, createdAt: { gte: startOfMonth } },
    }),

    // Pedidos mês passado
    prisma.order.count({
      where: { tenantId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),

    // Receita este mês
    prisma.financial.aggregate({
      where: { tenantId, type: 'RECEITA', status: 'PAGO', paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),

    // Receita mês passado
    prisma.financial.aggregate({
      where: { tenantId, type: 'RECEITA', status: 'PAGO', paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { amount: true },
    }),

    // Pedidos por status
    prisma.order.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true },
    }),

    // Artes por status
    prisma.art.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true },
    }),

    // Fila de produção (ativos)
    prisma.production.count({
      where: { tenantId, status: { in: ['APROVADO', 'EM_PRODUCAO'] } },
    }),

    // Pedidos atrasados
    prisma.order.count({
      where: {
        tenantId,
        deadline: { lt: now },
        status: { notIn: ['ENTREGUE', 'CANCELADO', 'FINALIZADO'] },
      },
    }),

    // Pedidos recentes
    prisma.order.findMany({
      where: { tenantId },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { name: true } } },
    }),

    // Top clientes por pedidos
    prisma.client.findMany({
      where: { tenantId, isActive: true },
      take: 5,
      orderBy: { totalOrders: 'desc' },
      select: { id: true, name: true, totalOrders: true, totalSpent: true },
    }),

    // Gráfico de receita (últimos 6 meses)
    prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "paidAt") as month,
        SUM(amount) as total
      FROM financials
      WHERE "tenantId" = ${tenantId}
        AND type = 'RECEITA'
        AND status = 'PAGO'
        AND "paidAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "paidAt")
      ORDER BY month ASC
    `,
  ]);

  const ordersGrowth = ordersLastMonth > 0
    ? Math.round(((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100)
    : ordersThisMonth > 0 ? 100 : 0;

  const revenueNow = revenueThisMonth._sum.amount || 0;
  const revenueLast = revenueLastMonth._sum.amount || 0;
  const revenueGrowth = revenueLast > 0
    ? Math.round(((revenueNow - revenueLast) / revenueLast) * 100)
    : revenueNow > 0 ? 100 : 0;

  return res.json({
    kpis: {
      totalClients,
      totalOrders,
      ordersThisMonth,
      ordersGrowth,
      revenueThisMonth: revenueNow,
      revenueGrowth,
      productionQueue,
      overdueOrders,
    },
    ordersByStatus: Object.fromEntries(ordersByStatus.map(s => [s.status, s._count.id])),
    artsByStatus: Object.fromEntries(artsByStatus.map(s => [s.status, s._count.id])),
    recentOrders,
    topClients,
    revenueChart,
  });
};
