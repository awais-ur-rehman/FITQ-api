import { Router } from 'express';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadScan } from '../middleware/upload';
import { listScansValidator, scanIdValidator } from '../validators/scan.validator';
import {
  createScan,
  getUserScans,
  getScanById,
  toggleFavorite,
  deleteScan,
} from '../controllers/scan.controller';

const router = Router();

router.use(auth);

router.post('/', uploadScan, createScan);
router.get('/', listScansValidator, validate, getUserScans);
router.get('/:id', scanIdValidator, validate, getScanById);
router.patch('/:id/favorite', scanIdValidator, validate, toggleFavorite);
router.delete('/:id', scanIdValidator, validate, deleteScan);

export default router;
