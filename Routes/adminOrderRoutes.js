// Routes/adminOrderRoutes.js
import express from 'express';
import {
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  deleteOrder,
  getOrderStats
} from '../Controller/AdminOrderController.js';
import { authenticateToken, isAdmin } from '../Middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, isAdmin);

router.get('/all', getAllOrders);
router.get('/stats', getOrderStats);
router.get('/:id', getOrderDetails);
router.put('/:id/status', updateOrderStatus);
router.delete('/:id', deleteOrder);

export default router;