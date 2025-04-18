import express from "express";
import { authUser } from "../middlewares/authMiddleware";
import { setBudget, getCurrentBudget, getBudgetHistory } from "../controllers/budgetController";

const router = express.Router();

router.post("/", authUser, setBudget);
router.get("/", authUser, getCurrentBudget);
router.get("/history", authUser, getBudgetHistory);

export default router;
