import React from 'react';
import {
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Trash2,
    RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { usePostStore, useAppStore } from '../../stores';
import { cn } from '../../lib/utils';

// Status badge component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
        posted: { icon: <CheckCircle size={14} />, color: 'text-green-500 bg-green-50 dark:bg-green-900/20', label: '投稿済み' },
        scheduled: { icon: <Clock size={14} />, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', label: '予約済み' },
        failed: { icon: <XCircle size={14} />, color: 'text-red-500 bg-red-50 dark:bg-red-900/20', label: '失敗' },
        partial: { icon: <AlertCircle size={14} />, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20', label: '部分的' },
        draft: { icon: <Clock size={14} />, color: 'text-gray-500 bg-gray-50 dark:bg-gray-800', label: '下書き' },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
        <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', config.color)}>
            {config.icon}
            {config.label}
        </span>
    );
};

// Post item component
const PostItem: React.FC<{
    post: {
        id: string;
        content: string;
        status: string;
        contentType: string;
        createdAt: Date;
        postedAt?: Date;
    };
    onDelete: () => void;
    onRetry?: () => void;
}> = ({ post, onDelete, onRetry }) => {
    const { language } = useAppStore();

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={post.status} />
                    <span className="text-xs text-gray-400">
                        {post.postedAt ? formatDate(post.postedAt) : formatDate(post.createdAt)}
                    </span>
                </div>
                <p className="text-sm text-gray-900 dark:text-white line-clamp-3">
                    {post.content}
                </p>
            </div>
            <div className="flex gap-1">
                {post.status === 'failed' && onRetry && (
                    <Button variant="ghost" size="icon" onClick={onRetry} title="再試行">
                        <RefreshCw size={16} />
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    className="text-red-500 hover:text-red-600"
                    title="削除"
                >
                    <Trash2 size={16} />
                </Button>
            </div>
        </div>
    );
};

// Main PostHistory component
export const PostHistory: React.FC = () => {
    const { posts, deletePost } = usePostStore();
    const { language } = useAppStore();

    const t = {
        ja: {
            title: '投稿履歴',
            description: '過去の投稿を確認・管理します',
            noPosts: '投稿履歴がありません',
            noPostsDesc: '新規投稿を作成して投稿を始めましょう',
            filter: {
                all: 'すべて',
                posted: '投稿済み',
                scheduled: '予約済み',
                failed: '失敗',
                draft: '下書き',
            },
            stats: {
                total: '合計',
                posted: '投稿済み',
                scheduled: '予約済み',
                failed: '失敗',
            },
        },
        en: {
            title: 'Post History',
            description: 'View and manage your past posts',
            noPosts: 'No posts yet',
            noPostsDesc: 'Create a new post to get started',
            filter: {
                all: 'All',
                posted: 'Posted',
                scheduled: 'Scheduled',
                failed: 'Failed',
                draft: 'Drafts',
            },
            stats: {
                total: 'Total',
                posted: 'Posted',
                scheduled: 'Scheduled',
                failed: 'Failed',
            },
        },
    };

    const labels = t[language];

    const [filter, setFilter] = React.useState<'all' | 'posted' | 'scheduled' | 'failed' | 'draft'>('all');

    const filteredPosts = posts.filter((post) => {
        if (filter === 'all') return true;
        return post.status === filter;
    });

    const stats = {
        total: posts.length,
        posted: posts.filter((p) => p.status === 'posted').length,
        scheduled: posts.filter((p) => p.status === 'scheduled').length,
        failed: posts.filter((p) => p.status === 'failed').length,
    };

    const filters = ['all', 'posted', 'scheduled', 'failed', 'draft'] as const;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{labels.title}</h2>
                    <p className="text-gray-500 mt-1">{labels.description}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                        <p className="text-xs text-gray-500">{labels.stats.total}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-500">{stats.posted}</p>
                        <p className="text-xs text-gray-500">{labels.stats.posted}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-500">{stats.scheduled}</p>
                        <p className="text-xs text-gray-500">{labels.stats.scheduled}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
                        <p className="text-xs text-gray-500">{labels.stats.failed}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                {filters.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            'px-4 py-2 text-sm rounded-lg transition-colors',
                            filter === f
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                        )}
                    >
                        {labels.filter[f]}
                    </button>
                ))}
            </div>

            {/* Post list */}
            <div className="space-y-3">
                {filteredPosts.length > 0 ? (
                    filteredPosts
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((post) => (
                            <PostItem
                                key={post.id}
                                post={post}
                                onDelete={() => deletePost(post.id)}
                            />
                        ))
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="py-12 text-center">
                            <Clock size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="font-medium text-gray-900 dark:text-white">{labels.noPosts}</h3>
                            <p className="text-sm text-gray-500 mt-1">{labels.noPostsDesc}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};
