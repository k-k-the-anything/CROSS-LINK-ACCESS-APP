import { BskyAgent, RichText } from '@atproto/api';
import type { AuthResult, PostContent, PostResult } from '../types';

// Bluesky service for handling authentication and posting
export class BlueskyService {
    private agent: BskyAgent;
    private session: { did: string; handle: string; accessJwt: string; refreshJwt: string } | null = null;

    constructor() {
        this.agent = new BskyAgent({ service: 'https://bsky.social' });
    }

    /**
     * Authenticate with Bluesky using App Password
     */
    async authenticate(handle: string, appPassword: string): Promise<AuthResult> {
        try {
            const response = await this.agent.login({
                identifier: handle,
                password: appPassword,
            });

            if (response.success) {
                this.session = {
                    did: response.data.did,
                    handle: response.data.handle,
                    accessJwt: response.data.accessJwt,
                    refreshJwt: response.data.refreshJwt,
                };

                return {
                    success: true,
                    accessToken: response.data.accessJwt,
                    refreshToken: response.data.refreshJwt,
                    userId: response.data.did,
                    username: response.data.handle,
                    displayName: response.data.handle,
                };
            }

            return {
                success: false,
                error: 'Authentication failed',
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Resume session with stored tokens
     */
    async resumeSession(accessJwt: string, refreshJwt: string, did: string, handle: string): Promise<boolean> {
        try {
            await this.agent.resumeSession({
                accessJwt,
                refreshJwt,
                did,
                handle,
                active: true,
            });
            this.session = { did, handle, accessJwt, refreshJwt };
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Create a post on Bluesky
     */
    async createPost(content: PostContent): Promise<PostResult> {
        if (!this.session) {
            return {
                success: false,
                error: 'Not authenticated. Please login first.',
                errorCode: 'NOT_AUTHENTICATED',
            };
        }

        try {
            // Create rich text for link/mention detection
            const rt = new RichText({ text: content.text });
            await rt.detectFacets(this.agent);

            // Prepare post record
            const postRecord: {
                $type: 'app.bsky.feed.post';
                text: string;
                facets?: typeof rt.facets;
                createdAt: string;
                embed?: unknown;
            } = {
                $type: 'app.bsky.feed.post',
                text: rt.text,
                facets: rt.facets,
                createdAt: new Date().toISOString(),
            };

            // Upload images if present
            if (content.media && content.media.length > 0) {
                const images = await Promise.all(
                    content.media.slice(0, 4).map(async (media) => {
                        const blob = await this.uploadBlob(media.filePath, media.fileType);
                        return {
                            alt: media.fileName || '',
                            image: blob,
                        };
                    })
                );

                postRecord.embed = {
                    $type: 'app.bsky.embed.images',
                    images,
                };
            }

            const response = await this.agent.post(postRecord);

            // Extract post ID from URI
            const postId = response.uri.split('/').pop() || '';
            const postUrl = `https://bsky.app/profile/${this.session.handle}/post/${postId}`;

            return {
                success: true,
                platformPostId: response.uri,
                platformPostUrl: postUrl,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create post',
                errorCode: 'POST_FAILED',
            };
        }
    }

    /**
     * Upload a blob (image) to Bluesky
     */
    private async uploadBlob(filePath: string, mimeType: string): Promise<{ $type: string; ref: { $link: string }; mimeType: string; size: number }> {
        // In browser/Tauri context, we need to read the file
        const response = await fetch(filePath);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const uploadResponse = await this.agent.uploadBlob(uint8Array, {
            encoding: mimeType,
        });

        return uploadResponse.data.blob;
    }

    /**
     * Validate post content for Bluesky
     */
    validateContent(content: PostContent): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check text length (300 graphemes)
        const graphemeLength = [...content.text].length;
        if (graphemeLength > 300) {
            errors.push(`Text exceeds 300 characters (current: ${graphemeLength})`);
        }

        // Check media count
        if (content.media && content.media.length > 4) {
            errors.push('Maximum 4 images allowed');
        }

        // Check media types
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (content.media) {
            for (const media of content.media) {
                if (!allowedTypes.includes(media.fileType)) {
                    errors.push(`Unsupported media type: ${media.fileType}`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Get current session info
     */
    getSession() {
        return this.session;
    }

    /**
     * Check if authenticated
     */
    isAuthenticated(): boolean {
        return this.session !== null;
    }

    /**
     * Logout
     */
    logout(): void {
        this.session = null;
    }
}

// Singleton instance
export const blueskyService = new BlueskyService();
