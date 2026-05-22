import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

type ApiHandler<T = any> = (req: NextRequest, context: T) => Promise<NextResponse>;

/**
 * Wraps an API route handler to provide consistent error handling
 * @param {Function} handler - The async route handler function
 * @returns {Function} Wrapped handler with error catching
 */
export function apiHandler<T = any>(handler: ApiHandler<T>): ApiHandler<T> {
    return async (req: NextRequest, context: T) => {
        try {
            return await handler(req, context);
        } catch (error: unknown) {
            console.error('API Error:', error);

            if (error instanceof ZodError) {
                const zodError = error as ZodError<unknown>;
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Validation failed',
                        details: zodError.issues.map((e) => ({
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
                    ...(process.env.NODE_ENV === 'development' && {
                        detail: (error as any)?.message || String(error),
                        code: (error as any)?.code,
                    }),
                },
                { status: 500 }
            );
        }
    };
}
