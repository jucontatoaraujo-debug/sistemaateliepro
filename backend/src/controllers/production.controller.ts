import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const DEFAULT_STEPS = ['SEPARACAO', 'MONTAGEM', 'BORDADO', 'ACABAMENTO', 'EMBALAGEM'];

export const list = async (req: AuthRequest, res: Response) => {
  const { status, machineId, operatorId, page = '1', limit = '20' } = req.query;
  const tenantId = req.user!.tenantId;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {
    tenantId,
    ...(status ? { status } : {}),
    ...(machineId ? { machineId } : {}),
    ...(operatorId ? { operatorId } : {}),
  };

  const [productions, total] = await Promise.all([
    prisma.production.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: [{ priority: 'desc' }, { scheduledAt: 'asc' }],
      include: {
        order: { include: { client: { select: { id: true, name: true } } } },
        machine: true,
        operator: { select: { id: true, name: true } },
        steps: { orderBy: { order: 'asc' } },
      },
    }),
    prisma.production.count({ where }),
  ]);

  return res.json({ data: productions, total, page: parseInt(page as string) });
};

export const queue = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;

  const productions = await prisma.production.findMany({
    where: { tenantId, status: { notIn: ['FINALIZADO', 'CANCELADO'] } },
    orderBy: [{ priority: 'desc' }, { scheduledAt: 'asc' }],
    include: {
      order: {
        include: {
          client: { select: { id: true, name: true } },
          items: { select: { quantity: true, embroideryType: true } },
        },
      },
      machine: true,
      operator: { select: { id: true, name: true } },
      steps: { orderBy: { order: 'asc' } },
    },
  });

  return res.json(productions);
};

export const getById = async (req: AuthRequest, res: Response) => {
  const production = await prisma.production.findFirst({
    where: { id: req.params.id, tenantId: req.user!.tenantId },
    include: {
      order: {
        include: {
          client: true,
          items: { include: { matrix: true, product: true } },
        },
      },
      machine: true,
      operator: { select: { id: true, name: true } },
      steps: { orderBy: { order: 'asc' } },
    },
  });
  if (!production) throw new AppError('Produção não encontrada.', 404);
  return res.json(production);
};

export const create = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { orderId, machineId, operatorId, scheduledAt, estimatedTime, priority, notes } = req.body;

  if (!orderId) throw new AppError('Pedido é obrigatório.');

  const order = await prisma.order.findFirst({ where: { id: orderId, tenantId } });
  if (!order) throw new AppError('Pedido não encontrado.', 404);

  const production = await prisma.production.create({
    data: {
      tenantId,
      orderId,
      machineId,
      operatorId,
      priority: priority || 'NORMAL',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      estimatedTime,
      notes,
      status: 'AGUARDANDO_ARTE',
      steps: {
        create: DEFAULT_STEPS.map((step, index) => ({
          step,
          order: index,
          status: 'PENDENTE',
        })),
      },
    },
    include: {
      order: { include: { client: { select: { id: true, name: true } } } },
      machine: true,
      steps: { orderBy: { order: 'asc' } },
    },
  });

  return res.status(201).json(production);
};

export const update = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.production.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
  if (!existing) throw new AppError('Produção não encontrada.', 404);

  const { scheduledAt, ...data } = req.body;
  const production = await prisma.production.update({
    where: { id: req.params.id },
    data: { ...data, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined },
  });
  return res.json(production);
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const existing = await prisma.production.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
  if (!existing) throw new AppError('Produção não encontrada.', 404);

  const updateData: any = { status };
  if (status === 'EM_PRODUCAO' && !existing.startedAt) updateData.startedAt = new Date();
  if (status === 'FINALIZADO') {
    updateData.finishedAt = new Date();
    if (existing.startedAt) {
      const minutes = Math.round((Date.now() - existing.startedAt.getTime()) / 60000);
      updateData.actualTime = minutes;
    }
  }

  const production = await prisma.production.update({ where: { id: req.params.id }, data: updateData });

  if (status === 'FINALIZADO') {
    await prisma.order.update({ where: { id: existing.orderId }, data: { status: 'FINALIZADO' } });
  } else if (status === 'EM_PRODUCAO') {
    await prisma.order.update({ where: { id: existing.orderId }, data: { status: 'EM_PRODUCAO' } });
  }

  return res.json(production);
};

export const updateStep = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.production.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
  if (!existing) throw new AppError('Produção não encontrada.', 404);

  const { status } = req.body;
  const stepData: any = { status };
  if (status === 'EM_ANDAMENTO') stepData.startedAt = new Date();
  if (status === 'CONCLUIDO') stepData.finishedAt = new Date();

  const step = await prisma.productionStep.update({ where: { id: req.params.stepId }, data: stepData });
  return res.json(step);
};
