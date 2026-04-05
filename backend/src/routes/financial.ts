import { Router } from 'express';
import * as ctrl from '../controllers/financial.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/summary', ctrl.summary);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.patch('/:id/pay', ctrl.markAsPaid);
router.delete('/:id', ctrl.remove);
router.post('/orders/:orderId/payment', ctrl.addPayment);

export default router;
