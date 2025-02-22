import express from 'express';
import { deleteUser, forgetPassword, getUserById, loginUser, registerUser, resetPassword, updateUser } from '../controllers/userController';
import { authUser } from '../middlewares/authMiddleware';
const router = express.Router();

router.get('/:id', authUser, getUserById)
router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/forgot-password', forgetPassword)
router.post('/reset-password', resetPassword)
router.delete("/:id", authUser, deleteUser)
router.patch('/:id', authUser, updateUser)

export default router;