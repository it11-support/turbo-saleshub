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
import { imageReadLimiter } from '@/utils/limiter.js';

const router = Router();

router.get('/image/:itemCode', imageReadLimiter, image);
router.use(authMiddleware);
router.post('/image/:itemCode', imageReadLimiter, imageUpload);
router.post('/images', imageReadLimiter, bulkUploadProducts);
router.delete('/image/:itemCode', imageReadLimiter, deleteImage);
router.get('/', fetchProducts);
router.post('/product-development', productDevelopment);
router.post('/info', updateInfo);
router.post('/development/remove', removeProductDevelopment);

export default router;
