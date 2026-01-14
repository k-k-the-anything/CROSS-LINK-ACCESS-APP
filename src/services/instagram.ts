/**
 * Instagram Graph API Service
 * 
 * Note: Instagram requires a Business/Creator account linked to a Facebook Page.
 * Authentication goes through Meta's OAuth flow.
 * 
 * Rate Limit: 200 requests/hour per user
 * Posting: Uses container-based publishing (create container -> publish)
 */

import type { AuthResult, PostContent, PostResult, RateLimitInfo } from '../types';

// Instagram OAuth scopes
export const INSTAGRAM_SCOPES = [
    'instagram_basic',
    'instagram_content_publish',
    'pages_read_engagement',
];

export interface InstagramMediaContainer {
    id: string;
    status: 'IN_PROGRESS' | 'FINISHED' | 'ERROR';
    statusCode?: string;
}

export class InstagramService {
    private accessToken: string | null = null;
    private igUserId: string | null = null;
    private readonly apiBase = 'https://graph.facebook.com/v18.0';

    /**
     * Initialize OAuth 2.0 flow for Meta (Facebook/Instagram)
     */
    async authenticate(appId: string, redirectUri: string): Promise<AuthResult> {
        // Meta OAuth URL
        const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
        authUrl.searchParams.set('client_id', appId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', INSTAGRAM_SCOPES.join(','));
        authUrl.searchParams.set('response_type', 'code');

        console.log('Open this URL for authentication:', authUrl.toString());

        return {
            success: false,
            error: 'OAuth flow not implemented. Please configure Meta Developer Console first.',
        };
    }

    /**
     * Set access token and fetch Instagram user ID
     */
    async setAccessToken(token: string): Promise<AuthResult> {
        this.accessToken = token;

        try {
            // Get pages connected to the user
            const pagesResponse = await fetch(
                `${this.apiBase}/me/accounts?fields=id,name,instagram_business_account&access_token=${token}`
            );

            if (!pagesResponse.ok) {
                throw new Error('Failed to fetch pages');
            }

            const pagesData = await pagesResponse.json();

            // Find a page with Instagram business account
            const pageWithInstagram = pagesData.data?.find(
                (page: { instagram_business_account?: { id: string } }) => page.instagram_business_account
            );

            if (!pageWithInstagram?.instagram_business_account) {
                return {
                    success: false,
                    error: 'No Instagram Business account found. Please link your Instagram to a Facebook Page.',
                };
            }

            this.igUserId = pageWithInstagram.instagram_business_account.id;

            // Get Instagram account info
            const igResponse = await fetch(
                `${this.apiBase}/${this.igUserId}?fields=id,username,name,profile_picture_url&access_token=${token}`
            );

            if (!igResponse.ok) {
                throw new Error('Failed to fetch Instagram account');
            }

            const igData = await igResponse.json();

            return {
                success: true,
                accessToken: token,
                userId: igData.id,
                username: igData.username,
                displayName: igData.name,
                avatarUrl: igData.profile_picture_url,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Authentication failed',
            };
        }
    }

    /**
     * Create a media container for publishing
     */
    private async createMediaContainer(
        imageUrl: string,
        caption: string,
        isCarouselItem = false
    ): Promise<InstagramMediaContainer | null> {
        if (!this.accessToken || !this.igUserId) return null;

        try {
            const params = new URLSearchParams({
                image_url: imageUrl,
                caption: isCarouselItem ? '' : caption,
                access_token: this.accessToken,
            });

            if (isCarouselItem) {
                params.set('is_carousel_item', 'true');
            }

            const response = await fetch(
                `${this.apiBase}/${this.igUserId}/media`,
                {
                    method: 'POST',
                    body: params,
                }
            );

            if (!response.ok) {
                throw new Error('Failed to create media container');
            }

            const data = await response.json();
            return { id: data.id, status: 'IN_PROGRESS' };
        } catch {
            return null;
        }
    }

    /**
     * Wait for media container to be ready
     */
    private async waitForContainer(containerId: string, maxAttempts = 10): Promise<boolean> {
        if (!this.accessToken) return false;

        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await fetch(
                    `${this.apiBase}/${containerId}?fields=status_code&access_token=${this.accessToken}`
                );

                if (!response.ok) return false;

                const data = await response.json();
                if (data.status_code === 'FINISHED') {
                    return true;
                }
                if (data.status_code === 'ERROR') {
                    return false;
                }

                // Wait 2 seconds before next check
                await new Promise((resolve) => setTimeout(resolve, 2000));
            } catch {
                return false;
            }
        }

        return false;
    }

    /**
     * Publish a media container
     */
    private async publishContainer(containerId: string): Promise<PostResult> {
        if (!this.accessToken || !this.igUserId) {
            return {
                success: false,
                error: 'Not authenticated',
                errorCode: 'NOT_AUTHENTICATED',
            };
        }

        try {
            const response = await fetch(
                `${this.apiBase}/${this.igUserId}/media_publish`,
                {
                    method: 'POST',
                    body: new URLSearchParams({
                        creation_id: containerId,
                        access_token: this.accessToken,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to publish media');
            }

            const data = await response.json();

            // Get the permalink
            const mediaResponse = await fetch(
                `${this.apiBase}/${data.id}?fields=permalink&access_token=${this.accessToken}`
            );

            const mediaData = await mediaResponse.json();

            return {
                success: true,
                platformPostId: data.id,
                platformPostUrl: mediaData.permalink,
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
     * Create a post with images
     * Note: Images must be publicly accessible URLs
     */
    async createPost(content: PostContent, imageUrls: string[]): Promise<PostResult> {
        if (!this.accessToken || !this.igUserId) {
            return {
                success: false,
                error: 'Not authenticated',
                errorCode: 'NOT_AUTHENTICATED',
            };
        }

        if (imageUrls.length === 0) {
            return {
                success: false,
                error: 'Instagram requires at least one image',
                errorCode: 'NO_MEDIA',
            };
        }

        try {
            let containerId: string;

            if (imageUrls.length === 1) {
                // Single image post
                const container = await this.createMediaContainer(imageUrls[0], content.text);
                if (!container) {
                    throw new Error('Failed to create media container');
                }
                containerId = container.id;
            } else {
                // Carousel post
                const itemContainers: string[] = [];

                for (const url of imageUrls.slice(0, 10)) {
                    const container = await this.createMediaContainer(url, '', true);
                    if (container) {
                        itemContainers.push(container.id);
                    }
                }

                // Wait for all items to process
                for (const id of itemContainers) {
                    await this.waitForContainer(id);
                }

                // Create carousel container
                const carouselResponse = await fetch(
                    `${this.apiBase}/${this.igUserId}/media`,
                    {
                        method: 'POST',
                        body: new URLSearchParams({
                            media_type: 'CAROUSEL',
                            children: itemContainers.join(','),
                            caption: content.text,
                            access_token: this.accessToken,
                        }),
                    }
                );

                if (!carouselResponse.ok) {
                    throw new Error('Failed to create carousel');
                }

                const carouselData = await carouselResponse.json();
                containerId = carouselData.id;
            }

            // Wait for container to be ready
            const isReady = await this.waitForContainer(containerId);
            if (!isReady) {
                throw new Error('Media processing failed');
            }

            // Publish
            return this.publishContainer(containerId);
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Post failed',
                errorCode: 'POST_FAILED',
            };
        }
    }

    /**
     * Validate content for Instagram
     */
    validateContent(content: PostContent): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (content.text.length > 2200) {
            errors.push('Caption exceeds 2200 characters');
        }

        const hashtagCount = (content.text.match(/#\w+/g) || []).length;
        if (hashtagCount > 30) {
            errors.push('Maximum 30 hashtags allowed');
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
        // Instagram rate limits are per-user and reset hourly
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
        return this.accessToken !== null && this.igUserId !== null;
    }

    /**
     * Logout
     */
    logout(): void {
        this.accessToken = null;
        this.igUserId = null;
    }
}

export const instagramService = new InstagramService();
