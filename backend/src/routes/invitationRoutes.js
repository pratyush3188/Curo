import { Router } from 'express';
import {
  getInvitations,
  createInvitation,
  resendInvitation,
  revokeInvitation,
  simulateActivation,
} from '../controllers/invitationController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';
import { createInvitationSchema } from '../validators/adminValidators.js';

const router = Router();

router.get('/', authenticate, requireRole('super_admin'), getInvitations);
router.post('/', authenticate, requireRole('super_admin'), validate(createInvitationSchema), createInvitation);
router.post('/:id/resend', authenticate, requireRole('super_admin'), resendInvitation);
router.post('/:id/revoke', authenticate, requireRole('super_admin'), revokeInvitation);
router.post('/:id/activate', authenticate, requireRole('super_admin'), simulateActivation);

export default router;
