import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const list = async (req: AuthRequest, res: Response) => {
  const { type, status, startDate, endDate, page = '1', limit = '20' } = req.query;
  const tenantId = req.user!.tenantId;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {
    tenantId,
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(startDate || endDate ? {
      createdAt: {
        ...(startDate ? { gte: new Date(startDate as string) } : {}),
        ...(endDate ? { lte: new Date(endDate as string) } : {}),
      },
    } : {}),
  };

  const [financials, total] = await Promise.all([
    prisma.financial.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { id: true, code: true, client: { select: { name: true } } } } },
    }),
    prisma.financial.count({ where }),
  ]);

  return res.json({ data: financials, total, page: parseInt(page as string) });
};

export const summary = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { startDate, endDate } = req.query;

  const dateFilter = startDate || endDate ? {
    createdAt: {
      ...(startDate ? { gte: new Date(startDate as string) } : {}),
      ...(endDate ? { lte: new Date(endDate as string) } : {}),
    },
  } : {};

  const [receitas, despesas, pendentes, vencidos] = await Promise.all([
    prisma.financial.aggregate({
      where: { tenantId, type: 'RECEITA', status: 'PAGO', ...dateFilter },
      _sum: { amount: true },
    }),
    prisma.financial.aggregate({
      where: { tenantId, type: 'DESPESA', status: 'PAGO', ...dateFilter },
      _sum: { amount: true },
    }),
    prisma.financial.aggregate({
      where: { tenantId, status: 'PENDENTE', ...dateFilter },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financial.aggregate({
      where: { tenantId, status: 'VENCIDO', ...dateFilter },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalReceitas = receitas._sum.amount || 0;
  const totalDespesas = despesas._sum.amount || 0;

  return res.json({
    receitas: totalReceitas,
    despesas: totalDespesas,
    lucro: totalReceitas - totalDespesas,
    pendentes: { total: pendentes._sum.amount || 0, count: pendentes._count },
    vencidos: { total: vencidos._sum.amount || 0, count: vencidos._count },
  });
};

export const getById = async (req: AuthRequest, res: Response) => {
  const financial = await prisma.financial.findFirst({
    where: { id: req.params.id, tenantId: req.user!.tenantId },
    include: { order: { select: { id: true, code: true } } },
  });
  if (!financial) throw new AppError('Registro financeiro não encontrado.', 404);
  return res.json(financial);
};

export const create = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const financial = await prisma.financial.create({
    data: {
      ...req.body,
      tenantId,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
    },
  });
  return res.status(201).json(financial);
};

export const update = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.financial.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
  if (!existing) throw new AppError('Registro não encontrado.', 404);

  const financial = await prisma.financial.update({
    where: { id: req.params.id },
    data: { ...req.body, dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined },
  });
  return res.json(financial);
};

export const markAsPaid = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.financial.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
  if (!existing) throw new AppError('Registro não encontrado.', 404);

  const financial = await prisma.financial.update({
    where: { id: req.params.id },
    data: { status: 'PAGO', paidAt: new Date() },
  });
  return res.json(financial);
};

export const remove = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.financial.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
  if (!existing) throw new AppError('Registro não encontrado.', 404);

  await prisma.financial.delete({ where: { id: req.params.id } });
  return res.json({ message: 'Registro removido.' });
};

export const addPayment = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const order = await prisma.order.findFirst({ where: { id: req.params.orderId, tenantId } });
  if (!order) throw new AppError('Pedido não encontrado.', 404);

  const { amount, method, notes } = req.body;

  const payment = await prisma.payment.create({
    data: { orderId: req.params.orderId, amount, method, notes },
  });

  // Check if fully paid
  const payments = await prisma.payment.findMany({ where: { orderId: req.params.orderId } });
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  if (totalPaid >= order.total) {
    await prisma.order.update({ where: { id: req.params.orderId }, data: { isPaid: true } });
    // Create financial entry
    await prisma.financial.create({
      data: {
        tenantId,
        orderId: req.params.orderId,
        type: 'RECEITA',
        description: `Pagamento pedido ${order.code}`,
        amount,
        status: 'PAGO',
        paidAt: new Date(),
      },
    });
  }

  return res.status(201).json(payment);
};
