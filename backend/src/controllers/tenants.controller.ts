import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getTenant = async (req: AuthRequest, res: Response) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.user!.tenantId },
    include: { settings: true, _count: { select: { users: true, clients: true, orders: true } } },
  });
  if (!tenant) throw new AppError('Ateliê não encontrado.', 404);
  return res.json(tenant);
};

export const updateTenant = async (req: AuthRequest, res: Response) => {
  const { settings, ...data } = req.body;
  const tenant = await prisma.tenant.update({
    where: { id: req.user!.tenantId },
    data: {
      ...data,
      settings: settings ? { upsert: { create: settings, update: settings } } : undefined,
    },
    include: { settings: true },
  });
  return res.json(tenant);
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    where: { tenantId: req.user!.tenantId },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true, isActive: true, lastLoginAt: true, createdAt: true },
  });
  return res.json(users);
};

export const createUser = async (req: AuthRequest, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) throw new AppError('Nome, email e senha são obrigatórios.');

  const existing = await prisma.user.findFirst({ where: { tenantId: req.user!.tenantId, email: email.toLowerCase() } });
  if (existing) throw new AppError('Email já cadastrado.');

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), password: hashed, role: role || 'OPERATOR', tenantId: req.user!.tenantId },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  return res.status(201).json(user);
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  const { password, ...data } = req.body;
  const updateData: any = { ...data };

  if (password) updateData.password = await bcrypt.hash(password, 12);

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  return res.json(user);
};
