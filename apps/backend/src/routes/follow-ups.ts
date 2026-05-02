import { fetchVisitsWithFollowUps } from '@/controllers/follow-ups/index.js';
import { authMiddleware } from '../middlewares/index.js';

import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.get('/', fetchVisitsWithFollowUps);

export default router;
