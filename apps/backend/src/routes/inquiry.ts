import { getInquiries, syncInquiries } from '@/controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';

import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.get('/:id', getInquiries);
router.post('/', syncInquiries);

export default router;
