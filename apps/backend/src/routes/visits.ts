import { getScheduleList } from '@/controllers/visits/index.js';
import { authMiddleware } from '../middlewares/index.js';

import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.get('/', getScheduleList);

export default router;
