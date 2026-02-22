import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

type ApiHandler = (req: NextRequest, context?: any) => Promise<NextResponse>;

/**
 * Wraps an API route handler to provide consistent error handling
 * @param {Function} handler - The async route handler function
 * @returns {Function} Wrapped handler with error catching
 */
export function apiHandler(handler: ApiHandler): ApiHandler {
    return async (req: NextRequest, context?: any) => {
        try {
            return await handler(req, context);
        } catch (error: any) {
            console.error('API Error:', error);

            if (error instanceof ZodError) {
                const zodError = error as ZodError;
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Validation failed',
                        details: zodError.errors.map((e: any) => ({
                            field: e.path.join('.'),
                            message: e.message,
                        })),
                    },
                    { status: 400 }
                );
            }

            if (error instanceof AppError) {
                return NextResponse.json(
                    {
                        success: false,
                        error: error.message,
                        code: error.code,
                    },
                    { status: error.statusCode }
                );
            }

            // Default 500
            return NextResponse.json(
                {
                    success: false,
                    error: 'Internal Server Error',
                    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
                },
                { status: 500 }
            );
        }
    };
}
