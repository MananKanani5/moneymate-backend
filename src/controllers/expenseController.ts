import { Request, Response } from "express";
import prisma from "../prisma";
import { sendResponse } from "../utils/responseUtils";
import STATUS_CODES from "../utils/statusCodes";
import { validateidParamSchema } from "../validators/idParamSchema";
import { formatPaginationResponse, getPaginationOptions } from "../utils/paginationUtils";
import { validateCreateExpenseSchema, validateUpdateExpenseSchema } from "../validators/expenseValidator";

import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);


import isoWeek from "dayjs/plugin/isoWeek";
dayjs.extend(isoWeek);
import { getFilterAndSortingOptions } from "../utils/filtersUtil";


export const getAllExpense = async (req: Request, res: Response): Promise<void> => {
    const { take, skip, page, pageSize } = getPaginationOptions(req.query, parseInt(process.env.DEFAULT_PAGE_SIZE || "10", 10));
    const { orderBy, where } = getFilterAndSortingOptions(req.query, req.user?.id);

    try {
        const expenses = await prisma.expense.findMany({
            where,
            orderBy,
            skip,
            take,
            include: {
                category: true
            }
        })

        if (expenses.length === 0) {
            sendResponse(res, true, [], "No Expense Found", STATUS_CODES.OK);
            return;
        }

        const totalRecords = await prisma.expense.count({ where });

        const totalAmount = await prisma.expense.aggregate({
            where,
            _sum: {
                amount: true
            }
        });
        const response = formatPaginationResponse(expenses, totalRecords, page, pageSize, totalAmount);

        sendResponse(res, true, response, "Expenses Retrieved Successfully", STATUS_CODES.OK);

    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.NOT_FOUND);
    }

}
export const getExpeseById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { error } = validateidParamSchema({ id });
    if (error) {
        sendResponse(res, false, error, error.details[0].message, STATUS_CODES.BAD_REQUEST);
    }
    try {

        const expense = await prisma.expense.findUnique({
            where: { id: parseInt(id, 10) }
        })

        if (!expense) {
            sendResponse(res, false, null, "Expense not Found", STATUS_CODES.NOT_FOUND);
            return;
        }

        sendResponse(res, true, expense, "Expense Fetched Succesfully", STATUS_CODES.OK);

    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}

export const createExpense = async (req: Request, res: Response): Promise<void> => {
    const { error } = validateCreateExpenseSchema(req.body);
    if (error) {
        sendResponse(res, false, error, error.details[0].message, STATUS_CODES.BAD_REQUEST);
        return;
    }

    const userId = req.user?.id as number;
    const { date, time, amount, categoryId, description } = req.body;

    try {
        const dateTime = dayjs(`${date} ${time}`, 'YYYY-MM-DD HH:mm').utc().toISOString();
        const currentMonth = dayjs.utc().month() + 1;
        const currentYear = dayjs.utc().year();

        const budget = await prisma.budget.findFirst({
            where: { userId, month: currentMonth, year: currentYear },
        });

        if (!budget) {
            sendResponse(res, false, null, "No budget set for this month. Please set a budget first.", STATUS_CODES.BAD_REQUEST);
            return;
        }

        const budgetAmount = Number(budget.amount);
        const startOfMonth = dayjs.utc().startOf("month").toDate();
        const endOfMonth = dayjs.utc().add(1, "month").startOf("month").toDate();

        const totalExpenses = await prisma.expense.aggregate({
            where: { userId, dateTime: { gte: startOfMonth, lt: endOfMonth } },
            _sum: { amount: true }
        });

        const currentSpent = totalExpenses._sum.amount ? Number(totalExpenses._sum.amount) : 0;
        const newExpenseAmount = parseFloat(amount);

        const updatedSpent = currentSpent + newExpenseAmount;

        if (updatedSpent > budgetAmount) {
            sendResponse(res, false, null, `Expense exceeds budget! Budget: ${budgetAmount}, Spent: ${currentSpent}, Remaining: ${budgetAmount - currentSpent}`, STATUS_CODES.BAD_REQUEST);
            return;
        }

        const newExpense = await prisma.expense.create({
            data: {
                dateTime,
                amount: newExpenseAmount,
                userId,
                categoryId: parseInt(categoryId),
                description
            }
        })

        sendResponse(res, true, newExpense, "Expense Added Successfully", STATUS_CODES.CREATED);

    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}

export const updateExpense = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { date, time, amount, categoryId, description } = req.body;
    const userId = req.user?.id as number;

    const { error } = validateUpdateExpenseSchema(req.body);
    if (error) {
        sendResponse(res, false, null, error.details[0].message, STATUS_CODES.BAD_REQUEST);
        return;
    }

    try {
        const existingExpense = await prisma.expense.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!existingExpense) {
            sendResponse(res, false, null, "Expense not found", STATUS_CODES.NOT_FOUND);
            return;
        }

        let updatedDate = existingExpense.dateTime;
        if (date && time) {
            updatedDate = dayjs(`${date} ${time}`, "YYYY-MM-DD HH:mm").utc().toDate();
        }

        const updatedExpenseAmount = amount ? parseFloat(amount) : existingExpense.amount;

        const currentMonth = dayjs.utc().month() + 1;
        const currentYear = dayjs.utc().year();

        const budget = await prisma.budget.findFirst({
            where: { userId, month: currentMonth, year: currentYear },
        });

        if (!budget) {
            sendResponse(res, false, null, "No budget set for this month. Please set a budget first.", STATUS_CODES.BAD_REQUEST);
            return;
        }

        const budgetAmount = Number(budget.amount);
        const startOfMonth = dayjs.utc().startOf("month").toDate();
        const endOfMonth = dayjs.utc().add(1, "month").startOf("month").toDate();

        const totalExpenses = await prisma.expense.aggregate({
            where: {
                userId,
                dateTime: { gte: startOfMonth, lt: endOfMonth },
                NOT: { id: parseInt(id) }
            },
            _sum: { amount: true }
        });

        const currentSpent = totalExpenses._sum.amount ? Number(totalExpenses._sum.amount) : 0;
        const updatedSpent = currentSpent + Number(updatedExpenseAmount);

        if (updatedSpent > budgetAmount) {
            sendResponse(res, false, null, `Expense update exceeds budget! Budget: ${budgetAmount}, Spent: ${currentSpent}, Remaining: ${budgetAmount - currentSpent}`, STATUS_CODES.BAD_REQUEST);
            return;
        }

        const updateData: any = {};
        if (date && time) updateData.dateTime = updatedDate;
        if (amount) updateData.amount = updatedExpenseAmount;
        if (categoryId) updateData.categoryId = parseInt(categoryId);
        if (description !== undefined) updateData.description = description;

        const updatedExpense = await prisma.expense.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        sendResponse(res, true, updatedExpense, "Expense Updated Successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, STATUS_CODES.SERVER_ERROR);
    }
};

export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    try {
        const lastTransactions = await prisma.expense.findMany({
            where: { userId },
            orderBy: { dateTime: "desc" },
            include: { category: true, },
            take: 3
        });

        const categoryWiseExpenses = await prisma.expense.groupBy({
            by: ["categoryId"],
            _sum: { amount: true },
            where: { userId, dateTime: { gte: dayjs.utc().startOf("month").toDate() } }
        });

        const categoryIds = categoryWiseExpenses.map(exp => exp.categoryId);
        const categories = await prisma.expenseCategory.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, categoryName: true, categoryColor: true }
        });

        const categoryData = categoryWiseExpenses.map(exp => {
            const category = categories.find(cat => cat.id === exp.categoryId);
            return {
                categoryId: exp.categoryId,
                categoryName: category?.categoryName || "Unknown",
                categoryColor: category?.categoryColor || "#000000",
                totalAmount: exp._sum.amount || 0
            };
        });

        const startOfWeek = dayjs.utc().startOf("isoWeek").toDate();
        const endOfWeek = dayjs.utc().endOf("isoWeek").toDate();

        const weeklyExpenses = await prisma.expense.findMany({
            where: {
                userId,
                dateTime: {
                    gte: startOfWeek,
                    lte: endOfWeek
                }
            },
            select: {
                dateTime: true,
                amount: true
            }
        });

        const weeklySummary: Record<string, number> = {
            Mon: 0,
            Tue: 0,
            Wed: 0,
            Thu: 0,
            Fri: 0,
            Sat: 0,
            Sun: 0
        };

        weeklyExpenses.forEach(expense => {
            const dayName = dayjs(expense.dateTime).local().format("ddd");
            if (weeklySummary[dayName] !== undefined) {
                weeklySummary[dayName] += Number(expense.amount);
            }
        });

        const startOfMonth = dayjs.utc().startOf("month").toDate();
        const endOfMonth = dayjs.utc().endOf("month").toDate();

        const totalExpenseCurrentMonth = await prisma.expense.aggregate({
            where: {
                userId,
                dateTime: { gte: startOfMonth, lte: endOfMonth }
            },
            _sum: { amount: true }
        });

        const totalExpense = totalExpenseCurrentMonth._sum.amount || 0;

        const currentMonth = dayjs.utc().month() + 1;
        const currentYear = dayjs.utc().year();

        const budget = await prisma.budget.findFirst({
            where: { userId, month: currentMonth, year: currentYear }
        });

        const budgetAmount = budget ? budget.amount : 0;

        sendResponse(res, true, { lastTransactions, categoryData, weeklySummary, totalExpense, budgetAmount }, "Dashboard Data Retrieved Successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, STATUS_CODES.SERVER_ERROR);
    }
};

export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id as number;

    try {
        const existingExpense = await prisma.expense.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!existingExpense) {
            sendResponse(res, false, null, "Expense not found", STATUS_CODES.NOT_FOUND);
            return;
        }

        await prisma.expense.delete({
            where: { id: parseInt(id) }
        });

        sendResponse(res, true, null, "Expense Deleted Successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, STATUS_CODES.SERVER_ERROR);
    }
};
