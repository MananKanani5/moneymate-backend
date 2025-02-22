import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/responseUtils';
import STATUS_CODES from '../utils/statusCodes';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.stack);
  sendResponse(res, false, err, err.message, STATUS_CODES.SERVER_ERROR);
};
