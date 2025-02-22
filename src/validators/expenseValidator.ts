import Joi from "joi";

export const createExpenseSchema = Joi.object({
    date: Joi.string().required(),
    time: Joi.string().required(),
    amount: Joi.number().required().min(1),
    description: Joi.string().optional(),
    categoryId: Joi.number().required(),
});
export const updateExpenseSchema = Joi.object({
    date: Joi.string().optional(),
    time: Joi.string().optional(),
    amount: Joi.number().optional().min(1),
    description: Joi.string().optional(),
    categoryId: Joi.number().optional(),
});

export const validateCreateExpenseSchema = (data: any) => createExpenseSchema.validate(data, { abortEarly: false });
export const validateUpdateExpenseSchema = (data: any) => updateExpenseSchema.validate(data, { abortEarly: false });


