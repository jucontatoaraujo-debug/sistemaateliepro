import { Response } from 'express';
import path from 'path';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const list = async (req: AuthRequest, res: Response) => {
  const { clientId, search, page = '1', limit = '20' } = req.query;
  const tenantId = req.user!.tenantId;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {
    tenantId,
    isActive: true,
    ...(clientId ? { clientId } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ],
    } : {}),
  };

  const [matrices, total] = await Promise.all([
    prisma.matrix.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.matrix.count({ where }),
  ]);

  return res.json({ data: matrices, total, page: parseInt(page as string) });
};

export const getById = async (req: AuthRequest, res: Response) => {
  const matrix = await prisma.matrix.findFirst({
    where: { id: req.params.id, tenantId: req.user!.tenantId },
    include: {
      client: { select: { id: true, name: true } },
      art: { select: { id: true, title: true } },
    },
  });
  if (!matrix) throw new AppError('Matriz não encontrada.', 404);
  return res.json(matrix);
};

export const create = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { name, clientId, artId, description, estimatedPoints, widthCm, heightCm, colors, colorList } = req.body;

  if (!name) throw new AppError('Nome da matriz é obrigatório.');

  const matrix = await prisma.matrix.create({
    data: {
      tenantId,
      clientId,
      artId,
      name,
      description,
      estimatedPoints: estimatedPoints ? parseInt(estimatedPoints) : undefined,
      widthCm: widthCm ? parseFloat(widthCm) : undefined,
      heightCm: heightCm ? parseFloat(heightCm) : undefined,
      colors: colors ? parseInt(colors) : undefined,
      colorList: colorList ? JSON.parse(colorList) : undefined,
      fileUrl: req.file ? `/uploads/matrices/${req.file.filename}` : undefined,
      fileName: req.file ? req.file.originalname : undefined,
      fileFormat: req.file ? path.extname(req.file.originalname).replace('.', '').toUpperCase() : undefined,
    },
    include: { client: { select: { id: true, name: true } } },
  });

  return res.status(201).json(matrix);
};

export const update = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.matrix.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
  if (!existing) throw new AppError('Matriz não encontrada.', 404);

  const matrix = await prisma.matrix.update({
    where: { id: req.params.id },
    data: req.body,
  });
  return res.json(matrix);
};

export const remove = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.matrix.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
  if (!existing) throw new AppError('Matriz não encontrada.', 404);

  await prisma.matrix.update({ where: { id: req.params.id }, data: { isActive: false } });
  return res.json({ message: 'Matriz removida.' });
};
