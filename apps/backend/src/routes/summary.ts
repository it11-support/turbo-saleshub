import { customerLoyalty, customerTrend, fetchActiveCustomers, fetchCustomersByRangeItem, fetchRevenueByAccountCategory, fetchRevenueByCategory, mtdSummary } from '../controllers/summary/index.js';
import { authMiddleware } from '../middlewares/index.js';

import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.get('/', mtdSummary);
router.get('/customer-loyalty', customerLoyalty)
router.get('/customer-trend', customerTrend)
router.get('/active-customers', fetchActiveCustomers)
router.get('/customer-by-range-item', fetchCustomersByRangeItem)
router.get('/revenue-by-category', fetchRevenueByCategory)
router.get('/revenue-by-account', fetchRevenueByAccountCategory)

export default router;
