import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

type ApiHandler<T = unknown> = (req: NextRequest, context: T) => Promise<NextResponse>;

/**
 * Wraps an API route handler to provide consistent error handling
 * @param {Function} handler - The async route handler function
 * @returns {Function} Wrapped handler with error catching
 */
export function apiHandler<T = unknown>(handler: ApiHandler<T>): ApiHandler<T> {
    return async (req: NextRequest, context: T) => {
        try {
            return await handler(req, context);
        } catch (error: unknown) {
            console.error('API Error:', error);

            if (error instanceof Response) {
                const text = await error.text();
                return NextResponse.json(
                    {
                        success: false,
                        error: text || (error.status === 401 ? 'Unauthorized' : 'Forbidden'),
                    },
                    { status: error.status }
                );
            }

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
                        detail: error instanceof Error ? error.message : String(error),
                        code: typeof error === 'object' && error !== null && 'code' in error
                            ? String(error.code)
                            : undefined,
                    }),
                },
                { status: 500 }
            );
        }
    };
}
