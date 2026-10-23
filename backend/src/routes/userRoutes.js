import { Router } from 'express';
import { getProfile, updateProfile, getDoctors } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public doctor directory
router.get('/doctors', getDoctors);

// Authenticated user profile routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;
