import Joi from "joi";

const nameSchema = Joi.string().trim().min(2).max(50).required();
const emailSchema = Joi.string().trim().email().lowercase().required();
const phoneSchema = Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .required();
const passwordSchema = Joi.string()
    .trim()
    .min(8)
    .max(32)
    .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .message("Password must be at least 8 characters long and include one uppercase letter, one number, and one special character.")

export const registerUserSchema = Joi.object({
    firstName: nameSchema,
    lastName: nameSchema,
    phoneNumber: phoneSchema,
    email: emailSchema,
    password: passwordSchema.required(),
});

export const loginUserSchema = Joi.object({
    email: emailSchema,
    password: passwordSchema.required()
})

export const forgotPasswordUserSchema = Joi.object({
    email: emailSchema
})
export const resetPasswordUserSchema = Joi.object({
    email: emailSchema,
    otp: Joi.string().required(),
    newPassword: passwordSchema
})

export const updateUserSchema = Joi.object({
    firstName: nameSchema.optional(),
    lastName: nameSchema.optional(),
    phoneNumber: phoneSchema.optional(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
});

export const validateRegisterUser = (data: any) => registerUserSchema.validate(data, { abortEarly: false });
export const validateLoginUserSchema = (data: any) => loginUserSchema.validate(data, { abortEarly: false });
export const validateforgotPasswordUserSchema = (data: any) => forgotPasswordUserSchema.validate(data, { abortEarly: false });
export const validateResetPasswordUserSchema = (data: any) => resetPasswordUserSchema.validate(data, { abortEarly: false });
export const validateUpdateUserSchema = (data: any) => updateUserSchema.validate(data, { abortEarly: false });
