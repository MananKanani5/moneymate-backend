import express from 'express';
import { createExpense, deleteExpense, getAllExpense, getCategories, getDashboardData, getExpeseById, updateExpense } from '../controllers/expenseController';
import { authUser } from '../middlewares/authMiddleware';
const router = express.Router();

router.get('/', authUser, getAllExpense)
router.post('/', authUser, createExpense)
router.get('/dashboard', authUser, getDashboardData);
router.get('/categories', authUser, getCategories)
router.get('/:id', authUser, getExpeseById)
router.delete("/:id", deleteExpense)
router.patch('/:id', authUser, updateExpense)

export default router;