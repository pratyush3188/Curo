import { Router } from 'express';
import { register, login, getMe, updateDetails, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/update-details', authenticate, updateDetails);
router.post('/logout', logout);

export default router;
