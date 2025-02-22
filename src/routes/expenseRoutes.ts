import express from 'express';
import { createExpense, deleteExpense, getAllExpense, getDashboardData, getExpeseById, updateExpense } from '../controllers/expenseController';
import { authUser } from '../middlewares/authMiddleware';
const router = express.Router();

router.get('/', authUser, getAllExpense)
router.post('/', authUser, createExpense)
router.get('/dashboard', authUser, getDashboardData);
router.delete("/:id", deleteExpense)
router.patch('/:id', authUser, updateExpense)
router.get('/:id', authUser, getExpeseById)

export default router;