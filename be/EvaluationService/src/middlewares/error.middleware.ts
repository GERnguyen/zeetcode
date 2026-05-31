import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors/app.error";
import logger from "../config/logger.config";

function isAppError(err: unknown): err is AppError {
    return (
        err !== null &&
        typeof err === "object" &&
        typeof (err as Partial<AppError>).statusCode === "number" &&
        Number.isInteger((err as Partial<AppError>).statusCode) &&
        typeof (err as Partial<AppError>).message === "string"
    );
}

export const appErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (!isAppError(err)) {
        next(err);
        return;
    }

    logger.warn("Application error", {
        statusCode: err.statusCode,
        name: err.name,
        message: err.message,
    });

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
}

export const genericErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error("Unhandled error", err);

    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
}
