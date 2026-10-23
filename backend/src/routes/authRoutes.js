import { Router } from 'express';
import { register, login, getMe, updateDetails, logout } from '../controllers/authController.js';
import { acceptInvitation } from '../controllers/invitationController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, acceptInvitationSchema } from '../validators/adminValidators.js';

const router = Router();

router.post('/register', register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getMe);
router.put('/update-details', authenticate, updateDetails);
router.post('/logout', logout);

// Public invitation acceptance endpoint
router.post('/invitations/accept', validate(acceptInvitationSchema), acceptInvitation);

export default router;
