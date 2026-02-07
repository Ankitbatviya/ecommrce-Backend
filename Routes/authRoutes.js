import express from 'express';
import { 
  forgotPassword, 
  validateResetToken, 
  resetPassword 
} from '../Controller/UserController.js';

const router = express.Router();

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', validateResetToken);
router.post('/reset-password', resetPassword);

export default router;