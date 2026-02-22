/**
 * Custom application error class
 * Extends native Error with status code and operational flag
 */
export class AppError extends Error {
    statusCode: number;
    code: string | null;
    isOperational: boolean;

    /**
     * Create an AppError
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {string|null} code - Optional error code
     */
    constructor(message: string, statusCode: number, code: string | null = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
