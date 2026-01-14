/**
 * TikTok Content Posting API Service
 * 
 * Note: TikTok API requires app registration and review.
 * - Content Posting API: Allows posting videos to TikTok
 * - During review: Can only post to own account as private videos
 * - After approval: Can post public videos
 * 
 * Rate Limits: Varies by endpoint
 */

import type { AuthResult, PostResult, RateLimitInfo } from '../types';

// TikTok OAuth scopes
export const TIKTOK_SCOPES = [
    'user.info.basic',
    'video.upload',
    'video.publish',
];

export interface TikTokVideoMetadata {
    title: string;
    description?: string;
    privacyLevel: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
    disableComment?: boolean;
    disableDuet?: boolean;
    disableStitch?: boolean;
    videoCoverTimestampMs?: number;
}

export class TikTokService {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private openId: string | null = null;
    private readonly apiBase = 'https://open.tiktokapis.com/v2';

    /**
     * Initialize OAuth 2.0 flow for TikTok
     */
    async authenticate(clientKey: string, redirectUri: string): Promise<AuthResult> {
        const csrfState = crypto.randomUUID();

        const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
        authUrl.searchParams.set('client_key', clientKey);
        authUrl.searchParams.set('scope', TIKTOK_SCOPES.join(','));
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('state', csrfState);

        console.log('Open this URL for authentication:', authUrl.toString());

        return {
            success: false,
            error: 'OAuth flow not implemented. Please configure TikTok Developer Portal first.',
        };
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(
        code: string,
        clientKey: string,
        clientSecret: string,
        redirectUri: string
    ): Promise<AuthResult> {
        try {
            const response = await fetch(`${this.apiBase}/oauth/token/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_key: clientKey,
                    client_secret: clientSecret,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to exchange code for tokens');
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message || 'Token exchange failed');
            }

            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;
            this.openId = data.open_id;

            return {
                success: true,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: new Date(Date.now() + data.expires_in * 1000),
                userId: data.open_id,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Token exchange failed',
            };
        }
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(
        refreshToken: string,
        clientKey: string,
        clientSecret: string
    ): Promise<AuthResult> {
        try {
            const response = await fetch(`${this.apiBase}/oauth/token/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_key: clientKey,
                    client_secret: clientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;

            return {
                success: true,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: new Date(Date.now() + data.expires_in * 1000),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Token refresh failed',
            };
        }
    }

    /**
     * Get user info
     */
    async getUserInfo(): Promise<{ id: string; username: string; displayName: string; avatarUrl: string } | null> {
        if (!this.accessToken) return null;

        try {
            const response = await fetch(`${this.apiBase}/user/info/?fields=open_id,union_id,avatar_url,display_name`, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            });

            if (!response.ok) return null;

            const data = await response.json();

            return {
                id: data.data.user.open_id,
                username: data.data.user.display_name,
                displayName: data.data.user.display_name,
                avatarUrl: data.data.user.avatar_url,
            };
        } catch {
            return null;
        }
    }

    /**
     * Initialize video upload
     * Returns an upload URL for the video file
     */
    async initializeVideoUpload(
        videoSize: number,
        chunkSize: number = 10 * 1024 * 1024 // 10MB default
    ): Promise<{ uploadUrl: string; publishId: string } | null> {
        if (!this.accessToken) return null;

        try {
            const response = await fetch(`${this.apiBase}/post/publish/video/init/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    post_info: {
                        title: 'Video upload',
                        privacy_level: 'SELF_ONLY', // Start as private
                    },
                    source_info: {
                        source: 'FILE_UPLOAD',
                        video_size: videoSize,
                        chunk_size: chunkSize,
                        total_chunk_count: Math.ceil(videoSize / chunkSize),
                    },
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to initialize upload');
            }

            const data = await response.json();

            return {
                uploadUrl: data.data.upload_url,
                publishId: data.data.publish_id,
            };
        } catch {
            return null;
        }
    }

    /**
     * Upload video chunk
     */
    async uploadVideoChunk(
        uploadUrl: string,
        chunk: Blob,
        chunkIndex: number,
        totalChunks: number
    ): Promise<boolean> {
        try {
            const response = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'video/mp4',
                    'Content-Range': `bytes ${chunkIndex * chunk.size}-${(chunkIndex + 1) * chunk.size - 1}/${totalChunks * chunk.size}`,
                },
                body: chunk,
            });

            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Publish video after upload
     */
    async publishVideo(publishId: string, metadata: TikTokVideoMetadata): Promise<PostResult> {
        if (!this.accessToken) {
            return {
                success: false,
                error: 'Not authenticated',
                errorCode: 'NOT_AUTHENTICATED',
            };
        }

        try {
            const response = await fetch(`${this.apiBase}/post/publish/status/fetch/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    publish_id: publishId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to check publish status');
            }

            const data = await response.json();

            if (data.data.status === 'PUBLISH_COMPLETE') {
                return {
                    success: true,
                    platformPostId: data.data.publicaly_available_post_id?.[0] || publishId,
                    platformPostUrl: `https://www.tiktok.com/@user/video/${data.data.publicaly_available_post_id?.[0] || ''}`,
                };
            }

            return {
                success: false,
                error: `Publish status: ${data.data.status}`,
                errorCode: 'PUBLISH_PENDING',
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Publish failed',
                errorCode: 'PUBLISH_FAILED',
            };
        }
    }

    /**
     * Validate video for TikTok
     */
    validateVideo(file: File): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check file type
        const allowedTypes = ['video/mp4', 'video/webm'];
        if (!allowedTypes.includes(file.type)) {
            errors.push(`Unsupported video type: ${file.type}. Allowed: MP4, WebM`);
        }

        // Check file size (max 4GB)
        const maxSize = 4 * 1024 * 1024 * 1024;
        if (file.size > maxSize) {
            errors.push('Video exceeds 4GB maximum size');
        }

        // Check minimum size
        const minSize = 1024;
        if (file.size < minSize) {
            errors.push('Video is too small (minimum 1KB)');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Get rate limit info
     */
    async getRateLimits(): Promise<RateLimitInfo> {
        // TikTok rate limits vary by endpoint
        return {
            remaining: 100,
            limit: 100,
            resetAt: new Date(Date.now() + 86400000), // 24 hours
        };
    }

    /**
     * Check if authenticated
     */
    isAuthenticated(): boolean {
        return this.accessToken !== null && this.openId !== null;
    }

    /**
     * Logout
     */
    logout(): void {
        this.accessToken = null;
        this.refreshToken = null;
        this.openId = null;
    }
}

export const tiktokService = new TikTokService();
