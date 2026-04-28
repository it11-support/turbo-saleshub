import { fetchActivityActionTypes, fetchActivityLogs } from '@/controllers/activity-log/index.js';
import { authMiddleware } from '../middlewares/index.js';

import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.get('/', fetchActivityLogs);
router.get('/action-types', fetchActivityActionTypes);

export default router;
