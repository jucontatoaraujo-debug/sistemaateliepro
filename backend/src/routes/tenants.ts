import { Router } from 'express';
import { getTenant, updateTenant, getUsers, createUser, updateUser } from '../controllers/tenants.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/me', getTenant);
router.put('/me', authorize('OWNER', 'ADMIN'), updateTenant);
router.get('/users', getUsers);
router.post('/users', authorize('OWNER', 'ADMIN'), createUser);
router.put('/users/:id', authorize('OWNER', 'ADMIN'), updateUser);

export default router;
