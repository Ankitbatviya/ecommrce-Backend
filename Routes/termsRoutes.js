// Routes/termsRoutes.js
import express from 'express';
import { getTerms, getAllTerms, updateTerms } from '../Controller/TermsController.js';
import { authenticate, requireAdmin } from '../Middleware/auth.js'; // 

const router = express.Router();

// Public route - anyone can view active terms
router.get('/:type', getTerms);

// Protected routes - require authentication
router.get('/', authenticate, getAllTerms); // Admin only - gets all versions
router.post('/update', authenticate, requireAdmin, updateTerms); // Admin only - update terms

export default router;