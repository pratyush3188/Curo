import { Router } from 'express';
import multer from 'multer';
import {
  analyzeReport,
  getUserReports,
  getReportById,
  togglePinReport,
  deleteReport,
  getDietPlan,
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

// All report features require user authentication
router.use(authenticate);

router.post('/analyze', upload.single('file'), analyzeReport);
router.get('/', getUserReports);
router.get('/:id', getReportById);
router.patch('/:id/pin', togglePinReport);
router.delete('/:id', deleteReport);
router.post('/diet', getDietPlan);

export default router;
