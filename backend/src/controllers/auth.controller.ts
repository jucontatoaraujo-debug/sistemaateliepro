import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const generateToken = (payload: object) =>
  jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);

export const login = async (req: Request, res: Response) => {
  const { email, password, slug } = req.body;

  if (!email || !password) throw new AppError('Email e senha são obrigatórios.');

  const tenant = slug
    ? await prisma.tenant.findUnique({ where: { slug } })
    : null;

  const user = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      ...(tenant ? { tenantId: tenant.id } : {}),
      isActive: true,
    },
    include: { tenant: { select: { id: true, name: true, slug: true, plan: true, logoUrl: true } } },
  });

  if (!user) throw new AppError('Credenciais inválidas.', 401);

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new AppError('Credenciais inválidas.', 401);

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const token = generateToken({ id: user.id, tenantId: user.tenantId, role: user.role, email: user.email });

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      tenant: user.tenant,
    },
  });
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password, tenantName, tenantSlug } = req.body;

  if (!name || !email || !password || !tenantName || !tenantSlug) {
    throw new AppError('Todos os campos são obrigatórios.');
  }

  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(tenantSlug)) {
    throw new AppError('O slug do ateliê deve conter apenas letras minúsculas, números e hífens.');
  }

  const existingTenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (existingTenant) throw new AppError('Este slug já está em uso. Escolha outro.');

  const hashedPassword = await bcrypt.hash(password, 12);

  const tenant = await prisma.tenant.create({
    data: {
      name: tenantName,
      slug: tenantSlug,
      settings: { create: {} },
      users: {
        create: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'OWNER',
        },
      },
    },
    include: { users: { take: 1 } },
  });

  const user = tenant.users[0];
  const token = generateToken({ id: user.id, tenantId: tenant.id, role: user.role, email: user.email });

  return res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    },
  });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { tenant: { select: { id: true, name: true, slug: true, plan: true, logoUrl: true } } },
  });
  if (!user) throw new AppError('Usuário não encontrado.', 404);

  const { password: _, ...safeUser } = user;
  return res.json(safeUser);
};

export const refreshToken = async (req: AuthRequest, res: Response) => {
  const token = generateToken({
    id: req.user!.id,
    tenantId: req.user!.tenantId,
    role: req.user!.role,
    email: req.user!.email,
  });
  return res.json({ token });
};
