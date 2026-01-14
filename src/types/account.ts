import { PlatformType } from './platform';

export interface Account {
    id: string;
    platform: PlatformType;
    platformUserId?: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    isActive: boolean;
    tokenExpiresAt?: Date;
    lastSyncAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface AccountCredentials {
    accessToken?: string;
    refreshToken?: string;
    appPassword?: string;
    handle?: string;
    expiresAt?: Date;
}
