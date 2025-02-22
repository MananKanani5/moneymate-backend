import { Router, Request, Response } from 'express';
import userRoutes from "./routes/userRoutes";
import expenseRoutes from "./routes/expenseRoutes";
import budgetRoutes from "./routes/budgetRoutes";

const router = Router();


router.get('/', (req: Request, res: Response) => {
    res.json({ message: 'API is running' });
});
router.use('/user', userRoutes)
router.use('/expense', expenseRoutes)
router.use('/budget', budgetRoutes);

export default router;