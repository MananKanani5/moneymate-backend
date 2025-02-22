import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { sendResponse } from '../utils/responseUtils';
import STATUS_CODES from '../utils/statusCodes';

export const authUser = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate("jwt", { session: false }, async (err: any, user: any) => {
        if (err) {
            sendResponse(res, false, err, "Server error during authentication", STATUS_CODES.SERVER_ERROR);
            return;
        }

        if (!user) {
            sendResponse(res, false, null, "Unauthorized", STATUS_CODES.UNAUTHORIZED);
            return;
        }

        req.user = user;

        next();
    })(req, res, next);
};
