import { PlatformType } from './platform';

export type PostStatus = 'draft' | 'scheduled' | 'posting' | 'posted' | 'partial' | 'failed';
export type ContentType = 'text' | 'image' | 'video' | 'carousel';

export interface Post {
    id: string;
    title?: string;
    content: string;
    contentType: ContentType;
    mediaPaths?: string[];
    hashtags?: string[];
    status: PostStatus;
    scheduledAt?: Date;
    postedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CrossPostTarget {
    id: string;
    postId: string;
    accountId: string;
    platformPostId?: string;
    platformPostUrl?: string;
    status: 'pending' | 'posting' | 'success' | 'failed' | 'skipped';
    errorCode?: string;
    errorMessage?: string;
    retryCount: number;
    postedAt?: Date;
}

export interface MediaFile {
    id: string;
    postId: string;
    filePath: string;
    fileName: string;
    fileType: string;
    fileSize?: number;
    width?: number;
    height?: number;
    duration?: number;
    thumbnailPath?: string;
    sortOrder: number;
}

export interface PostTemplate {
    id: string;
    name: string;
    description?: string;
    content: string;
    hashtags?: string[];
    targetPlatforms?: PlatformType[];
    isFavorite: boolean;
    useCount: number;
}

export interface PostContent {
    text: string;
    media?: MediaFile[];
    hashtags?: string[];
    scheduledAt?: Date;
    platformSpecific?: Record<string, unknown>;
}

export interface PostResult {
    success: boolean;
    platformPostId?: string;
    platformPostUrl?: string;
    error?: string;
    errorCode?: string;
}
