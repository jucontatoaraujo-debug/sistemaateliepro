import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const list = async (req: AuthRequest, res: Response) => {
  const { search, category, page = '1', limit = '20' } = req.query;
  const tenantId = req.user!.tenantId;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {
    tenantId,
    isActive: true,
    ...(category ? { category } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ],
    } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, skip, take: parseInt(limit as string), orderBy: { name: 'asc' } }),
    prisma.product.count({ where }),
  ]);

  return res.json({ data: products, total });
};

export const lowStock = async (req: AuthRequest, res: Response) => {
  const products = await prisma.product.findMany({
    where: { tenantId: req.user!.tenantId, isActive: true, stock: { lte: prisma.product.fields.minStock } },
    orderBy: { stock: 'asc' },
  });
  return res.json(products);
};

export const getById = async (req: AuthRequest, res: Response) => {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, tenantId: req.user!.tenantId },
    include: { stockMoves: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
  if (!product) throw new AppError('Produto não encontrado.', 404);
  return res.json(product);
};

export const create = async (req: AuthRequest, res: Response) => {
  const product = await prisma.product.create({
    data: { ...req.body, tenantId: req.user!.tenantId },
  });
  return res.status(201).json(product);
};

export const update = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.product.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
  if (!existing) throw new AppError('Produto não encontrado.', 404);

  const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
  return res.json(product);
};

export const adjustStock = async (req: AuthRequest, res: Response) => {
  const { type, quantity, reason } = req.body;
  const existing = await prisma.product.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
  if (!existing) throw new AppError('Produto não encontrado.', 404);

  const delta = type === 'IN' ? quantity : type === 'OUT' ? -quantity : quantity - existing.stock;
  const newStock = existing.stock + delta;
  if (newStock < 0) throw new AppError('Estoque não pode ficar negativo.');

  const [product] = await prisma.$transaction([
    prisma.product.update({ where: { id: req.params.id }, data: { stock: newStock } }),
    prisma.stockMovement.create({
      data: { productId: req.params.id, type, quantity: Math.abs(delta), reason },
    }),
  ]);

  return res.json(product);
};
