import { Request, Response } from "express";
import prisma from "../prisma";
import { sendResponse } from "../utils/responseUtils";
import STATUS_CODES from "../utils/statusCodes";
import dayjs from "dayjs";

export const setBudget = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id as string;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        sendResponse(res, false, null, "Budget amount must be greater than zero.", STATUS_CODES.BAD_REQUEST);
        return;
    }

    const now = dayjs().tz("Asia/Kolkata");
    const currentMonth = now.month() + 1;
    const currentYear = now.year();

    try {
        const upsertedBudget = await prisma.budget.upsert({
            where: {
                userId_month_year: {
                    userId,
                    month: currentMonth,
                    year: currentYear
                }
            },
            update: {
                amount: Number(amount)
            },
            create: {
                userId,
                amount: Number(amount),
                month: currentMonth,
                year: currentYear
            }
        });

        const message = upsertedBudget.createdAt.getTime() === upsertedBudget.updatedAt.getTime()
            ? "Budget set successfully."
            : "Budget updated successfully.";

        sendResponse(res, true, upsertedBudget, message, STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, STATUS_CODES.SERVER_ERROR);
    }
};
//     const userId = req.user?.id as string;
//     const { id } = req.params;
//     const { amount } = req.body;

//     if (!amount || amount <= 0) {
//         sendResponse(res, false, null, "Budget amount must be greater than zero.", STATUS_CODES.BAD_REQUEST);
//         return;
//     }

//     try {
//         const budget = await prisma.budget.findFirst({
//             where: { id }
//         });

//         if (!budget || budget.userId !== userId) {
//             sendResponse(res, false, null, "Budget not found or unauthorized access.", STATUS_CODES.NOT_FOUND);
//             return;
//         }
//         const updatedBudget = await prisma.budget.update({
//             where: { id: budget.id },
//             data: { amount: Number(amount) }
//         });

//         sendResponse(res, true, updatedBudget, "Budget updated successfully.", STATUS_CODES.OK);
//     } catch (error: any) {
//         sendResponse(res, false, null, error.message, STATUS_CODES.SERVER_ERROR);
//     }
// };

export const getCurrentBudget = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id as string;
    const currentMonth = dayjs.utc().month() + 1;
    const currentYear = dayjs.utc().year();

    try {
        const budget = await prisma.budget.findFirst({
            where: { userId, month: currentMonth, year: currentYear }
        });

        if (!budget) {
            sendResponse(res, false, null, "No budget set for this month.", STATUS_CODES.NOT_FOUND);
            return;
        }

        sendResponse(res, true, budget, "Budget retrieved successfully.", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, STATUS_CODES.SERVER_ERROR);
    }
};

export const getBudgetHistory = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id as string;

    try {
        const budgets = await prisma.budget.findMany({
            where: { userId },
            orderBy: { year: "desc" }
        });

        if (budgets.length === 0) {
            sendResponse(res, false, [], "No budget history found.", STATUS_CODES.OK);
            return;
        }

        sendResponse(res, true, budgets, "Budget history retrieved successfully.", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, STATUS_CODES.SERVER_ERROR);
    }
};
