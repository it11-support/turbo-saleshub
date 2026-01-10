import { createUser, deleteUser, me, updateUser, userList } from '../controllers/index.js';
import { authMiddleware, roleMiddleware } from '../middlewares/index.js';

import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.get('/', roleMiddleware('admin'), userList);
router.get('/me', me);
router.put('/:id', roleMiddleware('admin'), updateUser);
router.post('/', roleMiddleware('admin'), createUser);
router.delete('/:id', roleMiddleware('admin'), deleteUser);

export default router;
