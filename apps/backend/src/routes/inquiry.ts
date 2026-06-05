import { getInquiries, syncInquiries } from '@/controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';

import { Router } from 'express';
import { defaultLimiter } from '@/utils/limiter.js';

const router = Router();

router.use(authMiddleware);

router.get('/:id', getInquiries);
router.post('/', defaultLimiter, syncInquiries);

export default router;
