import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export const errorHandler = (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error('Error:', error);

    const response: ApiResponse = {
        success: false,
        message: error.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString(),
    };

    const statusCode = error.statusCode || error.status || 500;

    res.status(statusCode).json(response);
}; 