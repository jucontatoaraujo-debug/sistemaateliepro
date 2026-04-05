import { Router } from 'express';
import * as ctrl from '../controllers/orders.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/kanban', ctrl.kanban);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.patch('/:id/status', ctrl.updateStatus);
router.delete('/:id', ctrl.remove);
router.post('/:id/items', ctrl.addItem);
router.put('/:id/items/:itemId', ctrl.updateItem);
router.delete('/:id/items/:itemId', ctrl.removeItem);

export default router;
