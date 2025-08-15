import { Request, Response, NextFunction, RequestHandler } from 'express';

// Utility to wrap async route handlers and forward errors to Express error middleware
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
