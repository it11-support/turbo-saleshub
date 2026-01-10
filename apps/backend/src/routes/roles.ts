import { roles } from '../controllers/index.js';
import { authMiddleware, roleMiddleware } from '../middlewares/index.js';

import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.get('/', roleMiddleware('admin'), roles);

export default router;
