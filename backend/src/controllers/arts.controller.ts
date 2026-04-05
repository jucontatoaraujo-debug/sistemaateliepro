import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const list = async (req: AuthRequest, res: Response) => {
  const { status, clientId, orderId, page = '1', limit = '20' } = req.query;
  const tenantId = req.user!.tenantId;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {
    tenantId,
    ...(status ? { status } : {}),
    ...(clientId ? { clientId } : {}),
    ...(orderId ? { orderId } : {}),
  };

  const [arts, total] = await Promise.all([
    prisma.art.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { updatedAt: 'desc' },
      include: {
        client: { select: { id: true, name: true } },
        versions: { orderBy: { version: 'desc' }, take: 1 },
        _count: { select: { versions: true } },
      },
    }),
    prisma.art.count({ where }),
  ]);

  return res.json({ data: arts, total, page: parseInt(page as string) });
};

export const getById = async (req: AuthRequest, res: Response) => {
  const art = await prisma.art.findFirst({
    where: { id: req.params.id, tenantId: req.user!.tenantId },
    include: {
      client: true,
      order: { select: { id: true, code: true, status: true } },
      versions: {
        orderBy: { version: 'desc' },
        include: { createdBy: { select: { id: true, name: true } } },
      },
      matrix: true,
    },
  });
  if (!art) throw new AppError('Arte não encontrada.', 404);
  return res.json(art);
};

export const create = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { clientId, orderId, title, description, deadline } = req.body;

  if (!clientId || !title) throw new AppError('Cliente e título são obrigatórios.');

  const art = await prisma.art.create({
    data: {
      tenantId,
      clientId,
      orderId,
      title,
      description,
      deadline: deadline ? new Date(deadline) : undefined,
      status: 'AGUARDANDO_CRIACAO',
    },
    include: { client: { select: { id: true, name: true } } },
  });

  if (orderId) {
    await prisma.order.update({ where: { id: orderId }, data: { status: 'AGUARDANDO_ARTE' } });
  }

  return res.status(201).json(art);
};

export const update = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.art.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
  if (!existing) throw new AppError('Arte não encontrada.', 404);

  const art = await prisma.art.update({
    where: { id: req.params.id },
    data: {
      ...req.body,
      deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
    },
  });
  return res.json(art);
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const existing = await prisma.art.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
  if (!existing) throw new AppError('Arte não encontrada.', 404);

  const art = await prisma.art.update({ where: { id: req.params.id }, data: { status } });
  return res.json(art);
};

export const addVersion = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const art = await prisma.art.findFirst({ where: { id: req.params.id, tenantId } });
  if (!art) throw new AppError('Arte não encontrada.', 404);

  const nextVersion = art.currentVersion + 1;

  const version = await prisma.artVersion.create({
    data: {
      artId: req.params.id,
      version: nextVersion,
      fileUrl: req.file ? `/uploads/arts/${req.file.filename}` : req.body.fileUrl,
      mockupUrl: req.body.mockupUrl,
      notes: req.body.notes,
      createdById: req.user!.id,
    },
  });

  await prisma.art.update({
    where: { id: req.params.id },
    data: { currentVersion: nextVersion, status: 'ENVIADA_PARA_APROVACAO' },
  });

  if (art.orderId) {
    await prisma.order.update({ where: { id: art.orderId }, data: { status: 'AGUARDANDO_APROVACAO' } });
  }

  return res.status(201).json(version);
};

export const approve = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { approvedBy } = req.body;

  const art = await prisma.art.findFirst({ where: { id: req.params.id, tenantId } });
  if (!art) throw new AppError('Arte não encontrada.', 404);

  await prisma.art.update({
    where: { id: req.params.id },
    data: { status: 'APROVADA', approvedAt: new Date(), approvedBy },
  });

  if (art.orderId) {
    await prisma.order.update({ where: { id: art.orderId }, data: { status: 'ARTE_APROVADA' } });
  }

  return res.json({ message: 'Arte aprovada com sucesso!' });
};

export const requestAdjustment = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { feedback } = req.body;

  const art = await prisma.art.findFirst({ where: { id: req.params.id, tenantId } });
  if (!art) throw new AppError('Arte não encontrada.', 404);

  await prisma.art.update({ where: { id: req.params.id }, data: { status: 'AJUSTE_SOLICITADO' } });

  // Salvar feedback na última versão
  const lastVersion = await prisma.artVersion.findFirst({
    where: { artId: req.params.id },
    orderBy: { version: 'desc' },
  });

  if (lastVersion && feedback) {
    await prisma.artVersion.update({ where: { id: lastVersion.id }, data: { feedback } });
  }

  if (art.orderId) {
    await prisma.order.update({ where: { id: art.orderId }, data: { status: 'ARTE_EM_CRIACAO' } });
  }

  return res.json({ message: 'Ajuste solicitado.' });
};
