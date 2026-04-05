import { Router } from 'express';
import * as ctrl from '../controllers/arts.controller';
import { authenticate } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.patch('/:id/status', ctrl.updateStatus);
router.post('/:id/versions', uploadImage.single('file'), ctrl.addVersion);
router.post('/:id/approve', ctrl.approve);
router.post('/:id/request-adjustment', ctrl.requestAdjustment);

export default router;
