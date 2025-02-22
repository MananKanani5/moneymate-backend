import express from "express";
import { authUser } from "../middlewares/authMiddleware";
import { setBudget, updateBudget, getCurrentBudget, getBudgetHistory } from "../controllers/budgetController";

const router = express.Router();

router.post("/", authUser, setBudget);
router.patch("/:id", authUser, updateBudget);
router.get("/", authUser, getCurrentBudget);
router.get("/history", authUser, getBudgetHistory);

export default router;
