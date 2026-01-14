import React, { useState } from 'react';
import {
    Eye,
    Smartphone,
    Monitor,
    Twitter,
    Youtube,
    Instagram,
    Hash,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { usePostStore, useAppStore, useAccountStore } from '../../stores';
import { PLATFORM_CONFIGS, PlatformType } from '../../types';
import { cn } from '../../lib/utils';

// Platform icons (simple text for now since lucide doesn't have all)
const platformIcons: Record<string, React.ReactNode> = {
    bluesky: <span className="text-lg">🦋</span>,
    youtube: <Youtube size={18} className="text-red-500" />,
    instagram: <Instagram size={18} className="text-pink-500" />,
    threads: <span className="text-lg">@</span>,
    tiktok: <span className="text-lg">♪</span>,
    x: <span className="font-bold">𝕏</span>,
};

// Preview card for each platform
const PlatformPreview: React.FC<{
    platform: PlatformType;
    content: string;
    username?: string;
}> = ({ platform, content, username }) => {
    const config = PLATFORM_CONFIGS[platform];
    const displayName = username || 'あなたのアカウント';
    const truncatedContent = content.length > config.maxTextLength
        ? content.slice(0, config.maxTextLength - 3) + '...'
        : content;
    const isOverLimit = content.length > config.maxTextLength;

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: config.color }}
                >
                    {platformIcons[platform] || config.name[0]}
                </div>
                <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {displayName}
                    </p>
                    <p className="text-xs text-gray-500">@{platform}_user • 今すぐ</p>
                </div>
                {platformIcons[platform]}
            </div>

            {/* Content */}
            <div className="p-4">
                <p className={cn(
                    'text-sm whitespace-pre-wrap',
                    isOverLimit ? 'text-red-500' : 'text-gray-900 dark:text-white'
                )}>
                    {truncatedContent || 'ここに投稿内容が表示されます...'}
                </p>
            </div>

            {/* Footer */}
            <div className="px-4 pb-3 flex items-center justify-between text-xs text-gray-500">
                <span>
                    {content.length} / {config.maxTextLength}
                    {isOverLimit && ' ⚠️ 文字数超過'}
                </span>
                <span>{config.name}</span>
            </div>
        </div>
    );
};

// Main PostPreview component
export const PostPreview: React.FC<{
    content?: string;
    isOpen?: boolean;
    onClose?: () => void;
}> = ({ content: propContent, isOpen = true, onClose }) => {
    const { currentDraft } = usePostStore();
    const { accounts } = useAccountStore();
    const { language } = useAppStore();
    const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | 'all'>('all');
    const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

    const content = propContent ?? currentDraft.content;

    const t = {
        ja: {
            title: '投稿プレビュー',
            description: '各プラットフォームでの表示を確認できます',
            all: 'すべて',
            mobile: 'モバイル',
            desktop: 'デスクトップ',
            noContent: '投稿内容を入力してください',
        },
        en: {
            title: 'Post Preview',
            description: 'See how your post will look on each platform',
            all: 'All',
            mobile: 'Mobile',
            desktop: 'Desktop',
            noContent: 'Enter post content to preview',
        },
    };

    const labels = t[language];

    const platforms: PlatformType[] = ['bluesky', 'x', 'youtube', 'instagram', 'threads', 'tiktok'];

    const filteredPlatforms = selectedPlatform === 'all'
        ? platforms
        : [selectedPlatform];

    const getAccountUsername = (platform: PlatformType): string | undefined => {
        const account = accounts.find((a) => a.platform === platform && a.isActive);
        return account?.username;
    };

    if (!isOpen) return null;

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Eye size={20} className="text-primary-500" />
                        {labels.title}
                    </h3>
                    <p className="text-sm text-gray-500">{labels.description}</p>
                </div>

                {/* View mode toggle */}
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('mobile')}
                    >
                        <Smartphone size={16} className="mr-1" />
                        {labels.mobile}
                    </Button>
                    <Button
                        variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('desktop')}
                    >
                        <Monitor size={16} className="mr-1" />
                        {labels.desktop}
                    </Button>
                </div>
            </div>

            {/* Platform filter */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setSelectedPlatform('all')}
                    className={cn(
                        'px-3 py-1.5 text-sm rounded-full transition-colors',
                        selectedPlatform === 'all'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                >
                    {labels.all}
                </button>
                {platforms.map((platform) => (
                    <button
                        key={platform}
                        onClick={() => setSelectedPlatform(platform)}
                        className={cn(
                            'px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1',
                            selectedPlatform === platform
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        )}
                    >
                        {platformIcons[platform]}
                        <span>{PLATFORM_CONFIGS[platform].name}</span>
                    </button>
                ))}
            </div>

            {/* Preview grid */}
            {content ? (
                <div className={cn(
                    'grid gap-4',
                    viewMode === 'mobile' ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                )}>
                    {filteredPlatforms.map((platform) => (
                        <PlatformPreview
                            key={platform}
                            platform={platform}
                            content={content}
                            username={getAccountUsername(platform)}
                        />
                    ))}
                </div>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <Eye size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500">{labels.noContent}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
