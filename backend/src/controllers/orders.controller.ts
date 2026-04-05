import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const generateOrderCode = async (tenantId: string) => {
  const count = await prisma.order.count({ where: { tenantId } });
  const year = new Date().getFullYear().toString().slice(-2);
  return `P${year}${String(count + 1).padStart(4, '0')}`;
};

const ORDER_STATUSES = [
  'NOVO', 'AGUARDANDO_ARTE', 'ARTE_EM_CRIACAO', 'AGUARDANDO_APROVACAO',
  'ARTE_APROVADA', 'EM_PRODUCAO', 'FINALIZADO', 'ENTREGUE', 'CANCELADO',
];

export const list = async (req: AuthRequest, res: Response) => {
  const { search, status, clientId, priority, page = '1', limit = '20', startDate, endDate } = req.query;
  const tenantId = req.user!.tenantId;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {
    tenantId,
    ...(status ? { status: status as string } : {}),
    ...(clientId ? { clientId: clientId as string } : {}),
    ...(priority ? { priority: priority as string } : {}),
    ...(search ? {
      OR: [
        { code: { contains: search as string, mode: 'insensitive' } },
        { client: { name: { contains: search as string, mode: 'insensitive' } } },
      ],
    } : {}),
    ...(startDate || endDate ? {
      createdAt: {
        ...(startDate ? { gte: new Date(startDate as string) } : {}),
        ...(endDate ? { lte: new Date(endDate as string) } : {}),
      },
    } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        client: { select: { id: true, name: true, whatsapp: true } },
        _count: { select: { items: true, arts: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return res.json({ data: orders, total, page: parseInt(page as string) });
};

export const kanban = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;

  const orders = await prisma.order.findMany({
    where: { tenantId, status: { not: 'CANCELADO' } },
    include: {
      client: { select: { id: true, name: true } },
      arts: { select: { id: true, status: true }, take: 1 },
      _count: { select: { items: true } },
    },
    orderBy: [{ priority: 'desc' }, { deadline: 'asc' }],
  });

  const grouped = ORDER_STATUSES.filter(s => s !== 'CANCELADO').reduce((acc, status) => {
    acc[status] = orders.filter(o => o.status === status);
    return acc;
  }, {} as Record<string, typeof orders>);

  return res.json(grouped);
};

export const getById = async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, tenantId: req.user!.tenantId },
    include: {
      client: true,
      items: { include: { product: true, matrix: true } },
      arts: { include: { versions: { orderBy: { version: 'desc' }, take: 1 } } },
      productions: { include: { machine: true, operator: { select: { id: true, name: true } }, steps: true } },
      payments: true,
      financial: true,
    },
  });
  if (!order) throw new AppError('Pedido não encontrado.', 404);
  return res.json(order);
};

export const create = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { items, ...data } = req.body;

  if (!data.clientId) throw new AppError('Cliente é obrigatório.');

  const client = await prisma.client.findFirst({ where: { id: data.clientId, tenantId } });
  if (!client) throw new AppError('Cliente não encontrado.', 404);

  const code = await generateOrderCode(tenantId);

  const order = await prisma.order.create({
    data: {
      ...data,
      tenantId,
      code,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      items: items?.length ? { create: items } : undefined,
    },
    include: {
      client: { select: { id: true, name: true } },
      items: true,
    },
  });

  // Recalculate total
  if (items?.length) {
    const total = items.reduce((sum: number, item: any) => sum + (item.total || item.unitPrice * item.quantity), 0);
    await prisma.order.update({ where: { id: order.id }, data: { total, subtotal: total } });
  }

  return res.status(201).json({ ...order, code });
};

export const update = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const existing = await prisma.order.findFirst({ where: { id: req.params.id, tenantId } });
  if (!existing) throw new AppError('Pedido não encontrado.', 404);

  const { items: _, ...data } = req.body;

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { ...data, deadline: data.deadline ? new Date(data.deadline) : undefined },
    include: { client: { select: { id: true, name: true } }, items: true },
  });

  return res.json(order);
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { status } = req.body;

  if (!ORDER_STATUSES.includes(status)) throw new AppError('Status inválido.');

  const existing = await prisma.order.findFirst({ where: { id: req.params.id, tenantId } });
  if (!existing) throw new AppError('Pedido não encontrado.', 404);

  const updateData: any = { status };
  if (status === 'ENTREGUE') updateData.deliveredAt = new Date();

  const order = await prisma.order.update({ where: { id: req.params.id }, data: updateData });

  await prisma.activityLog.create({
    data: {
      userId: req.user!.id,
      orderId: req.params.id,
      action: 'STATUS_CHANGE',
      entity: 'Order',
      entityId: req.params.id,
      details: { from: existing.status, to: status },
    },
  });

  return res.json(order);
};

export const remove = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const existing = await prisma.order.findFirst({ where: { id: req.params.id, tenantId } });
  if (!existing) throw new AppError('Pedido não encontrado.', 404);

  await prisma.order.update({ where: { id: req.params.id }, data: { status: 'CANCELADO' } });
  return res.json({ message: 'Pedido cancelado.' });
};

export const addItem = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const order = await prisma.order.findFirst({ where: { id: req.params.id, tenantId } });
  if (!order) throw new AppError('Pedido não encontrado.', 404);

  const item = await prisma.orderItem.create({
    data: { ...req.body, orderId: req.params.id },
    include: { product: true },
  });

  // Recalculate total
  const items = await prisma.orderItem.findMany({ where: { orderId: req.params.id } });
  const total = items.reduce((sum, i) => sum + i.total, 0);
  await prisma.order.update({ where: { id: req.params.id }, data: { total, subtotal: total } });

  return res.status(201).json(item);
};

export const updateItem = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const order = await prisma.order.findFirst({ where: { id: req.params.id, tenantId } });
  if (!order) throw new AppError('Pedido não encontrado.', 404);

  const item = await prisma.orderItem.update({
    where: { id: req.params.itemId },
    data: req.body,
  });

  const items = await prisma.orderItem.findMany({ where: { orderId: req.params.id } });
  const total = items.reduce((sum, i) => sum + i.total, 0);
  await prisma.order.update({ where: { id: req.params.id }, data: { total, subtotal: total } });

  return res.json(item);
};

export const removeItem = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const order = await prisma.order.findFirst({ where: { id: req.params.id, tenantId } });
  if (!order) throw new AppError('Pedido não encontrado.', 404);

  await prisma.orderItem.delete({ where: { id: req.params.itemId } });

  const items = await prisma.orderItem.findMany({ where: { orderId: req.params.id } });
  const total = items.reduce((sum, i) => sum + i.total, 0);
  await prisma.order.update({ where: { id: req.params.id }, data: { total, subtotal: total } });

  return res.json({ message: 'Item removido.' });
};
