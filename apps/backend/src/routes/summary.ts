import { customerLoyalty, fetchActiveCustomers, mtdSummary } from '../controllers/summary/index.js';
import { authMiddleware } from '../middlewares/index.js';

import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.get('/', mtdSummary);
router.get('/customer-loyalty', customerLoyalty)
router.get('/active-customers', fetchActiveCustomers)

export default router;
