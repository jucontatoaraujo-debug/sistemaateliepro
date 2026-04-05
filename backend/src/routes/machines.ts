import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();
router.use(authenticate);

router.get('/', async (req: any, res) => {
  const machines = await prisma.machine.findMany({ where: { tenantId: req.user.tenantId, isActive: true } });
  res.json(machines);
});

router.post('/', async (req: any, res) => {
  const machine = await prisma.machine.create({ data: { ...req.body, tenantId: req.user.tenantId } });
  res.status(201).json(machine);
});

router.put('/:id', async (req: any, res) => {
  const machine = await prisma.machine.update({ where: { id: req.params.id }, data: req.body });
  res.json(machine);
});

export default router;
