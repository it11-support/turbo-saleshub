import { authMiddleware } from '../middlewares/index.js';

import { Router } from 'express';
import { fetchNotifications } from '@/controllers/notifications/index.js';

const router = Router();

router.use(authMiddleware);

router.get('/', fetchNotifications);

export default router;
