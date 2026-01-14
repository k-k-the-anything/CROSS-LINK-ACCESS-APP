import React, { useState, useCallback } from 'react';
import { Send, Image, X, Calendar, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { useAccountStore, usePostStore, useAppStore } from '../../stores';
import { PLATFORM_CONFIGS, PlatformType, Account } from '../../types';
import { blueskyService } from '../../services';
import { cn } from '../../lib/utils';

// Platform checkbox component
const PlatformCheckbox: React.FC<{
    account: Account;
    isSelected: boolean;
    onToggle: () => void;
    disabled?: boolean;
}> = ({ account, isSelected, onToggle, disabled }) => {
    const config = PLATFORM_CONFIGS[account.platform];

    return (
        <button
            onClick={onToggle}
            disabled={disabled}
            className={cn(
                'flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
                isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
        >
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: config.color }}
            >
                <span className="text-white text-sm font-bold">{config.name.charAt(0)}</span>
            </div>
            <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {account.displayName || account.username}
                </p>
                <p className="text-xs text-gray-500">@{account.username}</p>
            </div>
            <div className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                isSelected
                    ? 'bg-primary-500 border-primary-500'
                    : 'border-gray-300 dark:border-gray-600'
            )}>
                {isSelected && <Check size={12} className="text-white" />}
            </div>
        </button>
    );
};

// Character counter component
const CharacterCounter: React.FC<{
    current: number;
    max: number;
    platform: string;
}> = ({ current, max, platform }) => {
    const percentage = (current / max) * 100;
    const isOverLimit = current > max;
    const isNearLimit = current > max * 0.8;

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{platform}</span>
            <span className={cn(
                'text-sm font-medium',
                isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-gray-600 dark:text-gray-400'
            )}>
                {current}/{max}
            </span>
            {isOverLimit && <AlertTriangle size={14} className="text-red-500" />}
        </div>
    );
};

// Post result component
const PostResultBadge: React.FC<{
    platform: PlatformType;
    status: 'pending' | 'posting' | 'success' | 'failed';
    url?: string;
    error?: string;
}> = ({ platform, status, url, error }) => {
    const config = PLATFORM_CONFIGS[platform];

    return (
        <div className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
            status === 'success' && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            status === 'failed' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
            status === 'posting' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            status === 'pending' && 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        )}>
            <div
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{ backgroundColor: config.color }}
            >
                <span className="text-white text-xs font-bold">{config.name.charAt(0)}</span>
            </div>
            <span className="font-medium">{config.name}</span>
            {status === 'posting' && <Loader2 size={14} className="animate-spin" />}
            {status === 'success' && <Check size={14} />}
            {status === 'failed' && <X size={14} />}
            {url && (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline ml-auto"
                >
                    投稿を見る
                </a>
            )}
            {error && <span className="text-xs ml-auto">{error}</span>}
        </div>
    );
};

// Main PostComposer component
export const PostComposer: React.FC = () => {
    const { currentDraft, setDraftContent, clearDraft } = usePostStore();
    const { accounts, selectedAccountIds, toggleAccountSelection, selectAllAccounts, deselectAllAccounts } = useAccountStore();
    const { language } = useAppStore();

    const [isPosting, setIsPosting] = useState(false);
    const [postResults, setPostResults] = useState<Map<string, { status: 'posting' | 'success' | 'failed'; url?: string; error?: string }>>(new Map());

    const activeAccounts = accounts.filter((a) => a.isActive);
    const selectedAccounts = activeAccounts.filter((a) => selectedAccountIds.includes(a.id));

    const t = {
        ja: {
            title: '新規投稿を作成',
            placeholder: '今、何を共有しますか？',
            selectAccounts: '投稿先を選択',
            selectAll: 'すべて選択',
            deselectAll: 'すべて解除',
            noAccounts: 'アカウントが接続されていません',
            post: '投稿する',
            posting: '投稿中...',
            addMedia: '画像を追加',
            schedule: '予約投稿',
            characterCount: '文字数',
            postResults: '投稿結果',
            success: '投稿が完了しました！',
            clear: 'クリア',
        },
        en: {
            title: 'Create New Post',
            placeholder: 'What do you want to share?',
            selectAccounts: 'Select accounts',
            selectAll: 'Select all',
            deselectAll: 'Deselect all',
            noAccounts: 'No accounts connected',
            post: 'Post',
            posting: 'Posting...',
            addMedia: 'Add image',
            schedule: 'Schedule',
            characterCount: 'Characters',
            postResults: 'Post Results',
            success: 'Posted successfully!',
            clear: 'Clear',
        },
    };

    const labels = t[language];

    // Get character count for each platform
    const getCharacterLimits = useCallback(() => {
        const graphemeCount = [...currentDraft.content].length;
        const limits: { platform: string; current: number; max: number }[] = [];

        for (const account of selectedAccounts) {
            const config = PLATFORM_CONFIGS[account.platform];
            if (!limits.find((l) => l.platform === config.name)) {
                limits.push({
                    platform: config.name,
                    current: graphemeCount,
                    max: config.maxTextLength,
                });
            }
        }

        return limits;
    }, [currentDraft.content, selectedAccounts]);

    const handlePost = async () => {
        if (selectedAccounts.length === 0 || !currentDraft.content.trim()) return;

        setIsPosting(true);
        setPostResults(new Map());

        for (const account of selectedAccounts) {
            // Set posting status
            setPostResults((prev) => new Map(prev).set(account.id, { status: 'posting' }));

            try {
                if (account.platform === 'bluesky') {
                    // Check if we need to re-authenticate
                    if (!blueskyService.isAuthenticated()) {
                        // For now, skip - in production, we'd load credentials from storage
                        setPostResults((prev) => new Map(prev).set(account.id, {
                            status: 'failed',
                            error: '再認証が必要です'
                        }));
                        continue;
                    }

                    const result = await blueskyService.createPost({
                        text: currentDraft.content,
                        hashtags: currentDraft.hashtags,
                    });

                    if (result.success) {
                        setPostResults((prev) => new Map(prev).set(account.id, {
                            status: 'success',
                            url: result.platformPostUrl
                        }));
                    } else {
                        setPostResults((prev) => new Map(prev).set(account.id, {
                            status: 'failed',
                            error: result.error
                        }));
                    }
                } else {
                    // Other platforms not yet implemented
                    setPostResults((prev) => new Map(prev).set(account.id, {
                        status: 'failed',
                        error: '未対応プラットフォーム'
                    }));
                }
            } catch (error) {
                setPostResults((prev) => new Map(prev).set(account.id, {
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }));
            }
        }

        setIsPosting(false);
    };

    const handleClear = () => {
        clearDraft();
        setPostResults(new Map());
    };

    const characterLimits = getCharacterLimits();
    const hasOverLimit = characterLimits.some((l) => l.current > l.max);
    const canPost = selectedAccounts.length > 0 && currentDraft.content.trim() && !hasOverLimit && !isPosting;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{labels.title}</h2>
                {(currentDraft.content || postResults.size > 0) && (
                    <Button variant="ghost" size="sm" onClick={handleClear}>
                        {labels.clear}
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Editor */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardContent className="p-4">
                            <Textarea
                                value={currentDraft.content}
                                onChange={(e) => setDraftContent(e.target.value)}
                                placeholder={labels.placeholder}
                                className="min-h-[200px] resize-none border-0 focus:ring-0 text-lg"
                                disabled={isPosting}
                            />

                            {/* Character counters */}
                            {characterLimits.length > 0 && (
                                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                                    {characterLimits.map((limit) => (
                                        <CharacterCounter
                                            key={limit.platform}
                                            current={limit.current}
                                            max={limit.max}
                                            platform={limit.platform}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" disabled>
                                        <Image size={16} className="mr-2" />
                                        {labels.addMedia}
                                    </Button>
                                    <Button variant="outline" size="sm" disabled>
                                        <Calendar size={16} className="mr-2" />
                                        {labels.schedule}
                                    </Button>
                                </div>
                                <Button
                                    onClick={handlePost}
                                    disabled={!canPost}
                                    className="gap-2"
                                >
                                    {isPosting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            {labels.posting}
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            {labels.post}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Post Results */}
                    {postResults.size > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">{labels.postResults}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {selectedAccounts.map((account) => {
                                    const result = postResults.get(account.id);
                                    if (!result) return null;
                                    return (
                                        <PostResultBadge
                                            key={account.id}
                                            platform={account.platform}
                                            status={result.status}
                                            url={result.url}
                                            error={result.error}
                                        />
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar - Account Selection */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{labels.selectAccounts}</CardTitle>
                                {activeAccounts.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={selectedAccountIds.length === activeAccounts.length ? deselectAllAccounts : selectAllAccounts}
                                    >
                                        {selectedAccountIds.length === activeAccounts.length ? labels.deselectAll : labels.selectAll}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {activeAccounts.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">{labels.noAccounts}</p>
                            ) : (
                                activeAccounts.map((account) => (
                                    <PlatformCheckbox
                                        key={account.id}
                                        account={account}
                                        isSelected={selectedAccountIds.includes(account.id)}
                                        onToggle={() => toggleAccountSelection(account.id)}
                                        disabled={isPosting}
                                    />
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
