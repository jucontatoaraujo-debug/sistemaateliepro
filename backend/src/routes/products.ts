import { Router } from 'express';
import * as ctrl from '../controllers/products.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/low-stock', ctrl.lowStock);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.post('/:id/stock', ctrl.adjustStock);

export default router;
