/**
 * Error handling utilities for ClickUp API
 */

export enum ClickUpErrorType {
  AUTHENTICATION = 'authentication_error',
  AUTHORIZATION = 'authorization_error',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit_exceeded',
  VALIDATION = 'validation_error',
  NETWORK = 'network_error',
  UNKNOWN = 'unknown_error'
}

export class ClickUpError extends Error {
  type: ClickUpErrorType;
  statusCode?: number;
  originalError?: any;

  constructor(message: string, type: ClickUpErrorType, statusCode?: number, originalError?: any) {
    super(message);
    this.name = 'ClickUpError';
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Handle errors from ClickUp API responses
 */
export function handleApiError(error: any): never {
  // Log error to stderr (safe for STDIO transport)
  console.error('ClickUp API Error:', error);

  if (error instanceof ClickUpError) {
    throw error;
  }

  // Handle fetch errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    throw new ClickUpError(
      `Network error: Unable to connect to ClickUp API. Please check your internet connection.`,
      ClickUpErrorType.NETWORK,
      undefined,
      error
    );
  }

  // Handle HTTP response errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data || {};
    const errorMessage = data.err || data.message || 'Unknown error';

    switch (status) {
      case 401:
        throw new ClickUpError(
          `Authentication failed: Invalid ClickUp API token. Please check your CLICKUP_API_TOKEN environment variable.`,
          ClickUpErrorType.AUTHENTICATION,
          status,
          error
        );

      case 403:
        throw new ClickUpError(
          `Access denied: ${errorMessage}. You don't have permission to access this resource.`,
          ClickUpErrorType.AUTHORIZATION,
          status,
          error
        );

      case 404:
        throw new ClickUpError(
          `Resource not found: ${errorMessage}. The requested item does not exist or you don't have access to it.`,
          ClickUpErrorType.NOT_FOUND,
          status,
          error
        );

      case 429:
        throw new ClickUpError(
          `Rate limit exceeded: You've made too many requests. Please wait a moment before trying again.`,
          ClickUpErrorType.RATE_LIMIT,
          status,
          error
        );

      case 400:
        throw new ClickUpError(
          `Validation error: ${errorMessage}. Please check your input parameters.`,
          ClickUpErrorType.VALIDATION,
          status,
          error
        );

      case 500:
      case 502:
      case 503:
      case 504:
        throw new ClickUpError(
          `ClickUp server error (${status}): The ClickUp API is experiencing issues. Please try again later.`,
          ClickUpErrorType.UNKNOWN,
          status,
          error
        );

      default:
        throw new ClickUpError(
          `ClickUp API error (${status}): ${errorMessage}`,
          ClickUpErrorType.UNKNOWN,
          status,
          error
        );
    }
  }

  // Handle other errors
  throw new ClickUpError(
    `Unexpected error: ${error.message || String(error)}`,
    ClickUpErrorType.UNKNOWN,
    undefined,
    error
  );
}

/**
 * Format error for MCP tool response
 */
export function formatErrorForMCP(error: any): string {
  if (error instanceof ClickUpError) {
    return error.message;
  }

  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }

  return `Error: ${String(error)}`;
}
