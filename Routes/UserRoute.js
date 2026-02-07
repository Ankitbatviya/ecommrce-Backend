// Routes/userRoutes.js - UPDATED VERSION
import express from 'express';
import { 
    GetUsers, 
    AddUser, 
    compareUser, 
    getProfile, 
    updateUserRole,
    deleteUser,          // Add this import
    getUserStats         // Add this import
} from '../Controller/UserController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// ===================== PUBLIC ROUTES =====================
router.post('/register', AddUser);  // Registration
router.post('/login', compareUser);  // Login

// ===================== PROTECTED ROUTES =====================
router.get('/profile', authenticateToken, getProfile); // User profile

// ===================== ADMIN ONLY ROUTES =====================
router.get('/all', authenticateToken, isAdmin, GetUsers); // Get all users
router.get('/stats', authenticateToken, isAdmin, getUserStats); // Get user statistics
router.put('/:userId/role', authenticateToken, isAdmin, updateUserRole); // Update role
router.delete('/:userId', authenticateToken, isAdmin, deleteUser); // Delete user

export default router;