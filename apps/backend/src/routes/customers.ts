import { Router } from 'express';
import {
  createCustomer,
  customerList,
  customerSummary,
  fetchCustomerRevenue,
  fetchGroups,
  fetchProductCoverageByCustomer,
  fetchSubgroups,
  itemSuggestions,
  potentialCustomerList,
  purchaseHistory,
} from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';
import { importPotentialCustomers } from '@/controllers/customer/import.js';

const router = Router();

router.use(authMiddleware);

router.get('/subgroups', fetchSubgroups);
router.get('/groups', fetchGroups);
router.get('/', customerList);
router.post('/', createCustomer);
router.get('/potential', potentialCustomerList);
router.post('/potential/import', importPotentialCustomers)
router.get('/:id', customerSummary);
router.get('/:id/suggestions', itemSuggestions);
router.get('/:id/purchases', purchaseHistory);
router.get('/:id/avg-revenue', fetchCustomerRevenue);
router.get('/:id/product-coverage', fetchProductCoverageByCustomer);

export default router;
