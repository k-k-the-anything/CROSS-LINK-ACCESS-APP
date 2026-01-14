/**
 * Threads API Service
 * 
 * Note: Threads API is part of Meta's ecosystem and requires similar setup to Instagram.
 * Authentication goes through Meta's OAuth flow.
 * 
 * Rate Limit: 200 requests/hour per user
 */

import type { AuthResult, PostContent, PostResult, RateLimitInfo } from '../types';

// Threads OAuth scopes
export const THREADS_SCOPES = [
    'threads_basic',
    'threads_content_publish',
    'threads_manage_insights',
];

export class ThreadsService {
    private accessToken: string | null = null;
    private threadsUserId: string | null = null;
    private readonly apiBase = 'https://graph.threads.net/v1.0';

    /**
     * Initialize OAuth 2.0 flow for Threads
     */
    async authenticate(appId: string, redirectUri: string): Promise<AuthResult> {
        const authUrl = new URL('https://threads.net/oauth/authorize');
        authUrl.searchParams.set('client_id', appId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', THREADS_SCOPES.join(','));
        authUrl.searchParams.set('response_type', 'code');

        console.log('Open this URL for authentication:', authUrl.toString());

        return {
            success: false,
            error: 'OAuth flow not implemented. Please configure Meta Developer Console first.',
        };
    }

    /**
     * Exchange code for access token
     */
    async exchangeCodeForToken(
        code: string,
        appId: string,
        appSecret: string,
        redirectUri: string
    ): Promise<AuthResult> {
        try {
            const response = await fetch('https://graph.threads.net/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: appId,
                    client_secret: appSecret,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri,
                    code,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to exchange code');
            }

            const data = await response.json();
            return this.setAccessToken(data.access_token);
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Token exchange failed',
            };
        }
    }

    /**
     * Set access token and get user info
     */
    async setAccessToken(token: string): Promise<AuthResult> {
        this.accessToken = token;

        try {
            const response = await fetch(
                `${this.apiBase}/me?fields=id,username,name,threads_profile_picture_url&access_token=${token}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch user info');
            }

            const data = await response.json();
            this.threadsUserId = data.id;

            return {
                success: true,
                accessToken: token,
                userId: data.id,
                username: data.username,
                displayName: data.name,
                avatarUrl: data.threads_profile_picture_url,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Authentication failed',
            };
        }
    }

    /**
     * Create a text post
     */
    async createPost(content: PostContent): Promise<PostResult> {
        if (!this.accessToken || !this.threadsUserId) {
            return {
                success: false,
                error: 'Not authenticated',
                errorCode: 'NOT_AUTHENTICATED',
            };
        }

        try {
            // Step 1: Create a media container
            const containerResponse = await fetch(
                `${this.apiBase}/${this.threadsUserId}/threads`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        media_type: 'TEXT',
                        text: content.text,
                        access_token: this.accessToken,
                    }),
                }
            );

            if (!containerResponse.ok) {
                const error = await containerResponse.json();
                throw new Error(error.error?.message || 'Failed to create container');
            }

            const containerData = await containerResponse.json();
            const containerId = containerData.id;

            // Step 2: Publish the container
            const publishResponse = await fetch(
                `${this.apiBase}/${this.threadsUserId}/threads_publish`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        creation_id: containerId,
                        access_token: this.accessToken,
                    }),
                }
            );

            if (!publishResponse.ok) {
                throw new Error('Failed to publish thread');
            }

            const publishData = await publishResponse.json();

            // Get permalink
            const permalinkResponse = await fetch(
                `${this.apiBase}/${publishData.id}?fields=permalink&access_token=${this.accessToken}`
            );

            let permalink = '';
            if (permalinkResponse.ok) {
                const permalinkData = await permalinkResponse.json();
                permalink = permalinkData.permalink;
            }

            return {
                success: true,
                platformPostId: publishData.id,
                platformPostUrl: permalink || `https://www.threads.net/@${this.threadsUserId}/post/${publishData.id}`,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Post failed',
                errorCode: 'POST_FAILED',
            };
        }
    }

    /**
     * Create a post with image
     */
    async createImagePost(content: PostContent, imageUrl: string): Promise<PostResult> {
        if (!this.accessToken || !this.threadsUserId) {
            return {
                success: false,
                error: 'Not authenticated',
                errorCode: 'NOT_AUTHENTICATED',
            };
        }

        try {
            // Create image container
            const containerResponse = await fetch(
                `${this.apiBase}/${this.threadsUserId}/threads`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        media_type: 'IMAGE',
                        image_url: imageUrl,
                        text: content.text,
                        access_token: this.accessToken,
                    }),
                }
            );

            if (!containerResponse.ok) {
                throw new Error('Failed to create image container');
            }

            const containerData = await containerResponse.json();

            // Wait for processing
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // Publish
            const publishResponse = await fetch(
                `${this.apiBase}/${this.threadsUserId}/threads_publish`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        creation_id: containerData.id,
                        access_token: this.accessToken,
                    }),
                }
            );

            if (!publishResponse.ok) {
                throw new Error('Failed to publish');
            }

            const publishData = await publishResponse.json();

            return {
                success: true,
                platformPostId: publishData.id,
                platformPostUrl: `https://www.threads.net/post/${publishData.id}`,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Post failed',
                errorCode: 'POST_FAILED',
            };
        }
    }

    /**
     * Validate content for Threads
     */
    validateContent(content: PostContent): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (content.text.length > 500) {
            errors.push('Text exceeds 500 characters');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Get rate limits
     */
    async getRateLimits(): Promise<RateLimitInfo> {
        return {
            remaining: 200,
            limit: 200,
            resetAt: new Date(Date.now() + 3600000),
        };
    }

    /**
     * Check if authenticated
     */
    isAuthenticated(): boolean {
        return this.accessToken !== null && this.threadsUserId !== null;
    }

    /**
     * Logout
     */
    logout(): void {
        this.accessToken = null;
        this.threadsUserId = null;
    }
}

export const threadsService = new ThreadsService();
