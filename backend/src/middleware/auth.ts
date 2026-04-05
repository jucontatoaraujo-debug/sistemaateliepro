import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
    email: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      tenantId: string;
      role: string;
      email: string;
    };

    const user = await prisma.user.findFirst({
      where: { id: decoded.id, tenantId: decoded.tenantId, isActive: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo.' });
    }

    req.user = { id: user.id, tenantId: user.tenantId, role: user.role, email: user.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso não autorizado.' });
    }
    next();
  };
};
