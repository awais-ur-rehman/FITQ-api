import { Router } from 'express';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadAvatar as multerUploadAvatar } from '../middleware/upload';
import {
  updateProfileValidator,
  changePasswordValidator,
  deleteAccountValidator,
} from '../validators/profile.validator';
import {
  updateProfile,
  uploadAvatar,
  changePassword,
  getStats,
  deleteAccount,
} from '../controllers/profile.controller';

const router = Router();

router.use(auth);

router.patch('/', updateProfileValidator, validate, updateProfile);
router.patch('/avatar', multerUploadAvatar, uploadAvatar);
router.patch('/change-password', changePasswordValidator, validate, changePassword);
router.get('/stats', getStats);
router.delete('/', deleteAccountValidator, validate, deleteAccount);

export default router;
