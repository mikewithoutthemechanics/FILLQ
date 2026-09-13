import { Request, Response, NextFunction } from 'express';
import { validationResult, FieldValidationError } from 'express-validator';

/**
 * Middleware to handle express-validator validation errors safely
 */
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => {
        if ('path' in err) {
          return {
            param: (err as FieldValidationError).path,
            message: err.msg
          };
        }
        return {
          param: 'unknown',
          message: err.msg
        };
      })
    });
  }
  next();
}
