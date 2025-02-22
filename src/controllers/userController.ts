import { Request, Response } from "express";
import prisma from "../prisma";
import { sendResponse } from "../utils/responseUtils";
import { comparePassword, hashPassword } from "../utils/authUtils";
import STATUS_CODES from "../utils/statusCodes";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/emailUtil";
import { validateidParamSchema } from "../validators/idParamSchema";
import { validateforgotPasswordUserSchema, validateLoginUserSchema, validateRegisterUser, validateResetPasswordUserSchema, validateUpdateUserSchema } from "../validators/userValidator";

const userWithoutPassword = {
    id: true,
    firstName: true,
    lastName: true,
    phoneNumber: true,
    email: true,
    createdAt: true,
    updatedAt: true,
}

export const getUserById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { error } = validateidParamSchema({ id })
    if (error) {
        sendResponse(res, false, error, error.details[0].message, STATUS_CODES.BAD_REQUEST);
        return;
    }
    if (parseInt(id, 10) !== req.user?.id) {
        sendResponse(res, false, null, "Unauthorized: You can only access your own profile", STATUS_CODES.FORBIDDEN);
        return;
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id, 10) }, select: userWithoutPassword
        })

        if (!user) {
            sendResponse(res, false, null, "User Not Found", STATUS_CODES.NOT_FOUND);
            return;
        }

        sendResponse(res, true, user, "User Found Successfully", STATUS_CODES.OK);

    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const { error } = validateRegisterUser(req.body);
    if (error) {
        sendResponse(res, false, error, error.details[0].message, STATUS_CODES.BAD_REQUEST);
        return;
    }

    const { firstName, lastName, phoneNumber, email, password } = req.body;

    try {

        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            sendResponse(res, false, null, "User is already registered with same email", STATUS_CODES.CONFLICT);
            return;
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                firstName,
                lastName,
                phoneNumber,
                email,
                password: hashedPassword
            }
        })

        const { password: _, ...newUserWithoutPassword } = newUser

        sendResponse(res, true, newUserWithoutPassword, "successfully Registered", STATUS_CODES.CREATED);

    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { error } = validateLoginUserSchema(req.body);
    if (error) {
        sendResponse(res, false, error, error.details[0].message, STATUS_CODES.BAD_REQUEST);
        return;
    }

    const { email, password } = req.body
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (!existingUser) {
            sendResponse(res, false, null, "User not Found", STATUS_CODES.NOT_FOUND);
            return;
        }

        const isPasswordValid = await comparePassword(password, existingUser!.password);

        if (!isPasswordValid) {
            sendResponse(res, false, null, "Invalid Credentials", STATUS_CODES.UNAUTHORIZED);
            return;
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }

        const token = jwt.sign({ id: existingUser?.id, }, process.env.JWT_SECRET, { expiresIn: "1d" });

        const { password: _, ...userWithoutPassword } = existingUser;
        sendResponse(res, true, { ...userWithoutPassword, token }, "User login successful", STATUS_CODES.OK);

    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}

export const forgetPassword = async (req: Request, res: Response): Promise<void> => {
    const { error } = validateforgotPasswordUserSchema(req.body);
    if (error) {
        sendResponse(res, false, error, error.details[0].message, STATUS_CODES.BAD_REQUEST);
        return;
    }
    const { email } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            sendResponse(res, false, null, "User not found", STATUS_CODES.NOT_FOUND);
            return;
        }

        const otp = crypto.randomBytes(3).toString("hex").toUpperCase();
        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: hashedOtp,
                resetTokenExpiry: otpExpiry,
            },
        });

        await sendEmail({
            to: email,
            subject: "Your Password Reset OTP",
            text: `Use the following OTP to reset your password: ${otp}\n\nThis OTP is valid for 10 minutes.`,
        });

        sendResponse(res, true, null, "OTP sent to your email", STATUS_CODES.OK);

    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {

    const { error } = validateResetPasswordUserSchema(req.body);
    if (error) {
        sendResponse(res, false, error, error.details[0].message, STATUS_CODES.BAD_REQUEST);
        return;
    }
    const { email, otp, newPassword } = req.body;

    try {
        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
        const user = await prisma.user.findFirst({
            where: {
                email,
                resetToken: hashedOtp,
                resetTokenExpiry: { gte: new Date() },

            },
        });

        if (!user) {
            sendResponse(res, false, null, "Invalid or expired OTP", STATUS_CODES.BAD_REQUEST);
            return;
        }

        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        sendResponse(res, true, null, "Password reset successful", STATUS_CODES.OK);

    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { error } = validateidParamSchema({ id });

    if (error) {
        sendResponse(res, false, error, error.details[0].message, STATUS_CODES.BAD_REQUEST);
        return;
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { id: parseInt(id, 10) }
        })

        if (!existingUser) {
            sendResponse(res, false, null, "User not Found", STATUS_CODES.NOT_FOUND);
            return;
        }

        if (parseInt(id, 10) !== req.user?.id) {
            sendResponse(res, false, null, "Unauthorized: You can only access your own profile", STATUS_CODES.FORBIDDEN);
            return;
        }

        const deletedUser = await prisma.user.delete({
            where: { id: parseInt(id, 10) },
            select: userWithoutPassword
        })

        sendResponse(res, true, deletedUser, "Your account was deleted successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}

export const updateUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const idValidation = validateidParamSchema({ id });

    if (idValidation.error) {
        sendResponse(res, false, idValidation.error, "Invalid ID", STATUS_CODES.BAD_REQUEST);
        return;
    }

    const { error } = validateUpdateUserSchema(req.body);

    if (error) {
        sendResponse(res, false, error.details, error.details[0].message, STATUS_CODES.BAD_REQUEST);
        return;
    }

    const { firstName, lastName, phoneNumber, email, password } = req.body;

    try {

        const existingUser = await prisma.user.findUnique({
            where: { id: parseInt(id, 10) }
        })

        if (!existingUser) {
            sendResponse(res, false, null, "User Not Found", STATUS_CODES.NOT_FOUND);
            return;
        }

        const existingUserSameEmail = await prisma.user.findFirst({
            where: {
                email,
                id: { not: parseInt(id, 10) }
            }
        });


        if (existingUserSameEmail) {
            sendResponse(res, false, null, "A User is already registered with same email", STATUS_CODES.CONFLICT);
            return;
        }

        let hashedPassword;
        if (password) {
            hashedPassword = await hashPassword(password);
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id, 10) },
            data: {
                firstName,
                lastName,
                phoneNumber,
                email,
                password: hashedPassword
            },
            select: userWithoutPassword
        })

        sendResponse(res, true, updatedUser, "User updated successfully", STATUS_CODES.OK);

    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}