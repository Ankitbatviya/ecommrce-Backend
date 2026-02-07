// Routes/partnerProductRoutes.js
import express from 'express';
import {
  getPartnerProducts,
  createPartnerProduct,
  updatePartnerProduct,
  deletePartnerProduct
} from '../Controller/PartnerProductController.js';
import { authenticateToken, isPartner } from '../Middleware/auth.js';

const router = express.Router();

// All routes require partner authentication
router.use(authenticateToken, isPartner);

router.get('/', getPartnerProducts);
router.post('/', createPartnerProduct);
router.put('/:id', updatePartnerProduct);
router.delete('/:id', deletePartnerProduct);

export default router;