import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const list = async (req: AuthRequest, res: Response) => {
  const { search, page = '1', limit = '20', tags } = req.query;
  const tenantId = req.user!.tenantId;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {
    tenantId,
    isActive: true,
    ...(search ? {
      OR: [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { whatsapp: { contains: search as string } },
        { companyName: { contains: search as string, mode: 'insensitive' } },
      ],
    } : {}),
    ...(tags ? { tags: { some: { name: { in: (tags as string).split(',') } } } } : {}),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { name: 'asc' },
      include: {
        tags: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.client.count({ where }),
  ]);

  return res.json({ data: clients, total, page: parseInt(page as string), limit: parseInt(limit as string) });
};

export const getById = async (req: AuthRequest, res: Response) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, tenantId: req.user!.tenantId },
    include: {
      tags: true,
      files: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { _count: { select: { items: true } } },
      },
      matrices: { where: { isActive: true } },
      _count: { select: { orders: true, arts: true } },
    },
  });
  if (!client) throw new AppError('Cliente não encontrado.', 404);
  return res.json(client);
};

export const create = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { tags: tagNames, ...data } = req.body;

  if (!data.name) throw new AppError('Nome é obrigatório.');

  const client = await prisma.client.create({
    data: {
      ...data,
      tenantId,
      email: data.email?.toLowerCase(),
      tags: tagNames?.length ? {
        connectOrCreate: tagNames.map((name: string) => ({
          where: { tenantId_name: { tenantId, name } },
          create: { name, tenantId },
        })),
      } : undefined,
    },
    include: { tags: true },
  });

  return res.status(201).json(client);
};

export const update = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { tags: tagNames, ...data } = req.body;

  const existing = await prisma.client.findFirst({ where: { id: req.params.id, tenantId } });
  if (!existing) throw new AppError('Cliente não encontrado.', 404);

  const client = await prisma.client.update({
    where: { id: req.params.id },
    data: {
      ...data,
      email: data.email?.toLowerCase(),
      tags: tagNames !== undefined ? {
        set: [],
        connectOrCreate: tagNames.map((name: string) => ({
          where: { tenantId_name: { tenantId, name } },
          create: { name, tenantId },
        })),
      } : undefined,
    },
    include: { tags: true },
  });

  return res.json(client);
};

export const remove = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const existing = await prisma.client.findFirst({ where: { id: req.params.id, tenantId } });
  if (!existing) throw new AppError('Cliente não encontrado.', 404);

  await prisma.client.update({ where: { id: req.params.id }, data: { isActive: false } });
  return res.json({ message: 'Cliente removido com sucesso.' });
};

export const uploadFile = async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new AppError('Arquivo não enviado.');

  const existing = await prisma.client.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
  if (!existing) throw new AppError('Cliente não encontrado.', 404);

  const file = await prisma.clientFile.create({
    data: {
      clientId: req.params.id,
      name: req.body.name || req.file.originalname,
      url: `/uploads/clients/${req.file.filename}`,
      type: req.body.type || 'logo',
      size: req.file.size,
    },
  });

  return res.status(201).json(file);
};

export const removeFile = async (req: AuthRequest, res: Response) => {
  const client = await prisma.client.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
  if (!client) throw new AppError('Cliente não encontrado.', 404);

  await prisma.clientFile.delete({ where: { id: req.params.fileId } });
  return res.json({ message: 'Arquivo removido.' });
};
