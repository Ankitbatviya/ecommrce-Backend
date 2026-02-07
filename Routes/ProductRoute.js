import express from 'express';
import { 
    showProduct, 
    ShowOneProduct, 
    addProduct, 
    getPartnerProducts 
} from '../Controller/ProductController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', showProduct);
router.get('/:id', ShowOneProduct);

// Protected routes (require authentication)
router.post('/partner', authMiddleware, addProduct);
router.get('/partner', authMiddleware, getPartnerProducts);

export default router;