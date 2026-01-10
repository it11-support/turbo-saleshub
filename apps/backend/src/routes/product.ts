import { Router } from 'express';
import { image } from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';

const router = Router();

router.get('/image/:itemCode', image);

router.use(authMiddleware);

export default router;
