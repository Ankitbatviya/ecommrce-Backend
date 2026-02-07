// routes/cartRoutes.js
import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../Controller/CartController.js';
import { authMiddleware } from '../middleware/auth.js'; // Your auth middleware

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove', removeFromCart);
router.delete('/clear', clearCart);

export default router;