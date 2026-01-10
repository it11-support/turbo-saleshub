import { updateConfig, userConfig } from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';
import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.get('/', userConfig);
router.post('/', updateConfig);

export default router;
