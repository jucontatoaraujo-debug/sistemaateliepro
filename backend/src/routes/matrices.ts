import { Router } from 'express';
import * as ctrl from '../controllers/matrices.controller';
import { authenticate } from '../middleware/auth';
import { uploadMatrix } from '../middleware/upload';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', uploadMatrix.single('file'), ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
