import { authMiddleware } from '../middlewares/index.js';

import { Router } from 'express';
import { fetchNotifications, unreadNotifications, updateReadStatus } from '@/controllers/notifications/index.js';

const router = Router();

router.use(authMiddleware);

router.get('/', fetchNotifications);
router.get('/unread', unreadNotifications);
router.put('/:id/read', updateReadStatus)

export default router;
