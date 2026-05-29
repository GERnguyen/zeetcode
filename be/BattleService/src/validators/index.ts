import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";
import logger from "../config/logger.config";

export const validateRequestBody = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info("Validating request body");
      await schema.parseAsync(req.body);
      logger.info("Request body is valid");
      next();
    } catch (error) {
      logger.error("Request body is invalid");
      res.status(400).json({
        message: "Invalid request body",
        success: false,
        error,
      });
    }
  };
};

export const validateQueryParams = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.query);
      next();
    } catch (error) {
      res.status(400).json({
        message: "Invalid query params",
        success: false,
        error,
      });
    }
  };
};

export const validateRequestParams = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.params);
      next();
    } catch (error) {
      res.status(400).json({
        message: "Invalid request params",
        success: false,
        error,
      });
    }
  };
};
