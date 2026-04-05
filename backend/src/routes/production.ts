import { Router } from 'express';
import * as ctrl from '../controllers/production.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/queue', ctrl.queue);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.patch('/:id/status', ctrl.updateStatus);
router.patch('/:id/steps/:stepId', ctrl.updateStep);

export default router;
