import { Router } from 'express';
import {
  bulkUploadProducts,
  deleteImage,
  fetchProducts,
  image,
  imageUpload,
  productDevelopment,
  removeProductDevelopment,
  updateInfo,
} from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';

const router = Router();

router.get('/image/:itemCode', image);
router.post('/image/:itemCode', imageUpload);
router.post('/images', bulkUploadProducts);
router.delete('/image/:itemCode', deleteImage);
router.get('/', fetchProducts);
router.post('/product-development', productDevelopment);
router.post('/info', updateInfo);
router.post('/development/remove', removeProductDevelopment);

router.use(authMiddleware);

export default router;
