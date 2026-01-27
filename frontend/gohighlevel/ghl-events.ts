// Error Handling Utilities
// Centralized error handling and response formatting

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import type { ApiResponse, ApiError } from '@/types/api';
import { AuthenticationError, AuthorizationError } from './auth';

/**
 * Standard error codes
 */
export const ERROR_CODES = {
  // Client errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  BAD_REQUEST: 'BAD_REQUEST',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * Format error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number,
  details?: any
): NextResponse<ApiResponse> {
  const error: ApiError = {
    code,
    message,
    details,
  };

  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status: statusCode }
  );
}

/**
 * Handle API errors and return appropriate responses
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      'Validation failed',
      400,
      error.flatten()
    );
  }

  // Authentication errors
  if (error instanceof AuthenticationError) {
    return createErrorResponse(
      ERROR_CODES.AUTHENTICATION_REQUIRED,
      error.message,
      401
    );
  }

  // Authorization errors
  if (error instanceof AuthorizationError) {
    return createErrorResponse(ERROR_CODES.FORBIDDEN, error.message, 403);
  }

  // Database errors
  if (error instanceof DatabaseError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      'Database operation failed',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }

  // External API errors
  if (error instanceof ExternalApiError) {
    return createErrorResponse(
      ERROR_CODES.EXTERNAL_API_ERROR,
      error.message,
      error.statusCode || 502,
      error.details
    );
  }

  // Rate limit errors
  if (error instanceof RateLimitError) {
    return createErrorResponse(
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      429,
      { retry_after: error.retryAfter }
    );
  }

  // Generic errors (don't expose internals in production)
  if (error instanceof Error) {
    return createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      process.env.NODE_ENV === 'development'
        ? error.message
        : 'An unexpected error occurred',
      500
    );
  }

  // Unknown error type
  return createErrorResponse(
    ERROR_CODES.INTERNAL_ERROR,
    'An unexpected error occurred',
    500
  );
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status: statusCode }
  );
}

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ExternalApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ExternalApiError';
  }
}

export class RateLimitError extends Error {
  constructor(public retryAfter: number) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Validate request body with Zod schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: any
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body) as T;
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw new Error('Invalid request body');
  }
}

/**
 * Safely parse JSON request body
 */
export async function safeParseBody(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}
