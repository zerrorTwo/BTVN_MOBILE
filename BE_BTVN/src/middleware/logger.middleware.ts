import { Request, Response, NextFunction } from "express";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (Object.keys(req.query).length > 0) {
    console.log(`Query Params:`, JSON.stringify(req.query, null, 2));
  }

  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) {
      sanitizedBody.password = "***HIDDEN***";
    }
    if (sanitizedBody.newPassword) {
      sanitizedBody.newPassword = "***HIDDEN***";
    }
    console.log(`Body:`, JSON.stringify(sanitizedBody, null, 2));
  }

  if (req.headers.authorization) {
    console.log(
      `Authorization: ${req.headers.authorization.substring(0, 20)}...`,
    );
  }

  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    return originalJson(body);
  };

  next();
};
