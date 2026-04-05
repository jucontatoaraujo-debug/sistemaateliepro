import { Router } from 'express';
import * as ctrl from '../controllers/clients.controller';
import { authenticate } from '../middleware/auth';
import { uploadClientFile } from '../middleware/upload';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/files', uploadClientFile.single('file'), ctrl.uploadFile);
router.delete('/:id/files/:fileId', ctrl.removeFile);

export default router;
