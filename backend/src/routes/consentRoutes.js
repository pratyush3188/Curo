import { Router } from 'express';
import {
  grantConsent,
  revokeConsent,
  getMyConsents,
  checkConsentStatus,
} from '../controllers/consentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Patient Digital Consent Routes
router.post('/grant', grantConsent);
router.patch('/:id/revoke', revokeConsent);
router.get('/my', getMyConsents);
router.get('/verify', checkConsentStatus);

export default router;
