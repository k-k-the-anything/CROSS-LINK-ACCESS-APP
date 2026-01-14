/**
 * Error Handling Utilities
 * 
 * Centralized error handling for API calls and platform operations.
 */

import type { PlatformType } from '../types';

// Error codes
export type ErrorCode =
    | 'NETWORK_ERROR'
    | 'AUTH_EXPIRED'
    | 'AUTH_FAILED'
    | 'RATE_LIMITED'
    | 'CONTENT_TOO_LONG'
    | 'MEDIA_INVALID'
    | 'MEDIA_TOO_LARGE'
    | 'PLATFORM_ERROR'
    | 'NOT_AUTHENTICATED'
    | 'VALIDATION_ERROR'
    | 'UNKNOWN_ERROR';

export interface AppError {
    code: ErrorCode;
    message: string;
    platform?: PlatformType;
    details?: Record<string, unknown>;
    retryable: boolean;
    timestamp: Date;
}

// Error messages in Japanese and English
const errorMessages: Record<ErrorCode, { ja: string; en: string }> = {
    NETWORK_ERROR: {
        ja: 'ネットワークエラーが発生しました。接続を確認してください。',
        en: 'A network error occurred. Please check your connection.',
    },
    AUTH_EXPIRED: {
        ja: '認証の有効期限が切れました。再ログインしてください。',
        en: 'Authentication expired. Please log in again.',
    },
    AUTH_FAILED: {
        ja: '認証に失敗しました。資格情報を確認してください。',
        en: 'Authentication failed. Please check your credentials.',
    },
    RATE_LIMITED: {
        ja: 'レート制限に達しました。しばらく待ってから再試行してください。',
        en: 'Rate limit reached. Please wait and try again.',
    },
    CONTENT_TOO_LONG: {
        ja: 'コンテンツが長すぎます。文字数を減らしてください。',
        en: 'Content is too long. Please reduce the character count.',
    },
    MEDIA_INVALID: {
        ja: 'メディアファイルが無効です。形式を確認してください。',
        en: 'Media file is invalid. Please check the format.',
    },
    MEDIA_TOO_LARGE: {
        ja: 'メディアファイルが大きすぎます。',
        en: 'Media file is too large.',
    },
    PLATFORM_ERROR: {
        ja: 'プラットフォームでエラーが発生しました。',
        en: 'An error occurred on the platform.',
    },
    NOT_AUTHENTICATED: {
        ja: '認証されていません。ログインしてください。',
        en: 'Not authenticated. Please log in.',
    },
    VALIDATION_ERROR: {
        ja: '入力内容に問題があります。',
        en: 'There is an issue with your input.',
    },
    UNKNOWN_ERROR: {
        ja: '不明なエラーが発生しました。',
        en: 'An unknown error occurred.',
    },
};

/**
 * Create a standardized error object
 */
export function createError(
    code: ErrorCode,
    options?: {
        message?: string;
        platform?: PlatformType;
        details?: Record<string, unknown>;
        retryable?: boolean;
    }
): AppError {
    const retryableCodes: ErrorCode[] = ['NETWORK_ERROR', 'RATE_LIMITED', 'PLATFORM_ERROR'];

    return {
        code,
        message: options?.message || errorMessages[code].ja,
        platform: options?.platform,
        details: options?.details,
        retryable: options?.retryable ?? retryableCodes.includes(code),
        timestamp: new Date(),
    };
}

/**
 * Get localized error message
 */
export function getErrorMessage(code: ErrorCode, language: 'ja' | 'en' = 'ja'): string {
    return errorMessages[code]?.[language] || errorMessages.UNKNOWN_ERROR[language];
}

/**
 * Parse API error response
 */
export function parseApiError(
    error: unknown,
    platform?: PlatformType
): AppError {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return createError('NETWORK_ERROR', { platform });
    }

    // HTTP response errors
    if (error instanceof Response) {
        if (error.status === 401) {
            return createError('AUTH_EXPIRED', { platform });
        }
        if (error.status === 429) {
            return createError('RATE_LIMITED', { platform, retryable: true });
        }
        if (error.status >= 500) {
            return createError('PLATFORM_ERROR', { platform, retryable: true });
        }
    }

    // Error objects
    if (error instanceof Error) {
        // Check for common patterns
        if (error.message.toLowerCase().includes('rate limit')) {
            return createError('RATE_LIMITED', { platform, message: error.message });
        }
        if (error.message.toLowerCase().includes('auth')) {
            return createError('AUTH_FAILED', { platform, message: error.message });
        }

        return createError('UNKNOWN_ERROR', {
            platform,
            message: error.message,
            details: { originalError: error.name },
        });
    }

    return createError('UNKNOWN_ERROR', { platform });
}

/**
 * Retry helper with exponential backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options?: {
        maxRetries?: number;
        baseDelayMs?: number;
        maxDelayMs?: number;
        onRetry?: (attempt: number, error: AppError) => void;
    }
): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const baseDelayMs = options?.baseDelayMs ?? 1000;
    const maxDelayMs = options?.maxDelayMs ?? 30000;

    let lastError: AppError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = parseApiError(error);

            if (!lastError.retryable || attempt === maxRetries) {
                throw lastError;
            }

            // Exponential backoff with jitter
            const delay = Math.min(
                baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
                maxDelayMs
            );

            options?.onRetry?.(attempt + 1, lastError);

            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError || createError('UNKNOWN_ERROR');
}

/**
 * Rate limit tracker
 */
export class RateLimitTracker {
    private limits: Map<string, { remaining: number; resetAt: Date }> = new Map();

    update(platform: PlatformType, remaining: number, resetAt: Date): void {
        this.limits.set(platform, { remaining, resetAt });
    }

    canProceed(platform: PlatformType): boolean {
        const limit = this.limits.get(platform);
        if (!limit) return true;

        if (new Date() >= limit.resetAt) {
            this.limits.delete(platform);
            return true;
        }

        return limit.remaining > 0;
    }

    getWaitTime(platform: PlatformType): number {
        const limit = this.limits.get(platform);
        if (!limit) return 0;

        const now = new Date();
        if (now >= limit.resetAt) return 0;

        return limit.resetAt.getTime() - now.getTime();
    }
}

export const rateLimitTracker = new RateLimitTracker();
