// Platform types
export type PlatformType = 'bluesky' | 'youtube' | 'instagram' | 'threads' | 'tiktok';

export interface PlatformConfig {
    id: PlatformType;
    name: string;
    icon: string;
    color: string;
    maxTextLength: number;
    supportedMediaTypes: string[];
    maxMediaCount: number;
    maxVideoLength?: number;
    requiresBusinessAccount: boolean;
}

export interface AuthResult {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    userId?: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    error?: string;
}

export interface RateLimitInfo {
    remaining: number;
    limit: number;
    resetAt: Date;
}

export const PLATFORM_CONFIGS: Record<PlatformType, PlatformConfig> = {
    bluesky: {
        id: 'bluesky',
        name: 'Bluesky',
        icon: 'bluesky',
        color: '#0085FF',
        maxTextLength: 300,
        supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif'],
        maxMediaCount: 4,
        requiresBusinessAccount: false
    },
    youtube: {
        id: 'youtube',
        name: 'YouTube',
        icon: 'youtube',
        color: '#FF0000',
        maxTextLength: 5000,
        supportedMediaTypes: ['video/mp4', 'video/quicktime'],
        maxMediaCount: 1,
        maxVideoLength: 43200,
        requiresBusinessAccount: false
    },
    instagram: {
        id: 'instagram',
        name: 'Instagram',
        icon: 'instagram',
        color: '#E4405F',
        maxTextLength: 2200,
        supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
        maxMediaCount: 10,
        maxVideoLength: 90,
        requiresBusinessAccount: true
    },
    threads: {
        id: 'threads',
        name: 'Threads',
        icon: 'threads',
        color: '#000000',
        maxTextLength: 500,
        supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
        maxMediaCount: 10,
        maxVideoLength: 300,
        requiresBusinessAccount: true
    },
    tiktok: {
        id: 'tiktok',
        name: 'TikTok',
        icon: 'tiktok',
        color: '#000000',
        maxTextLength: 2200,
        supportedMediaTypes: ['video/mp4'],
        maxMediaCount: 1,
        maxVideoLength: 600,
        requiresBusinessAccount: false
    }
};
