// Routes/adminProductRoutes.js
import express from 'express';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
} from '../Controller/AdminProductController.js';
import { authenticateToken, isAdmin } from '../Middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, isAdmin);

router.get('/all', getAllProducts);
router.get('/stats', getProductStats);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;