import React from 'react';
import { PenSquare, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAppStore, useAccountStore, usePostStore } from '../../stores';
import { PLATFORM_CONFIGS, PlatformType } from '../../types';
import { cn } from '../../lib/utils';

// Platform icon component
const PlatformIcon: React.FC<{ platform: PlatformType; size?: number }> = ({ platform, size = 24 }) => {
    const config = PLATFORM_CONFIGS[platform];
    return (
        <div
            className={cn(
                'flex items-center justify-center rounded-full',
                `w-${size / 4} h-${size / 4}`
            )}
            style={{ backgroundColor: config.color, width: size, height: size }}
        >
            <span className="text-white text-xs font-bold">
                {config.name.charAt(0)}
            </span>
        </div>
    );
};

export const Dashboard: React.FC = () => {
    const { setCurrentView, language } = useAppStore();
    const { accounts } = useAccountStore();
    const { posts } = usePostStore();

    const activeAccounts = accounts.filter(a => a.isActive);
    const recentPosts = posts.slice(-5).reverse();
    const scheduledPosts = posts.filter(p => p.status === 'scheduled');

    const t = {
        ja: {
            welcome: 'ようこそ',
            connectedAccounts: '接続済みアカウント',
            scheduledPosts: '予約投稿',
            totalPosts: '合計投稿数',
            newPost: '新規投稿を作成',
            recentActivity: '最近のアクティビティ',
            noAccounts: 'アカウントが接続されていません',
            noActivity: 'まだアクティビティがありません',
            connectAccount: 'アカウントを接続',
            quickActions: 'クイックアクション',
        },
        en: {
            welcome: 'Welcome',
            connectedAccounts: 'Connected Accounts',
            scheduledPosts: 'Scheduled Posts',
            totalPosts: 'Total Posts',
            newPost: 'Create New Post',
            recentActivity: 'Recent Activity',
            noAccounts: 'No accounts connected',
            noActivity: 'No activity yet',
            connectAccount: 'Connect Account',
            quickActions: 'Quick Actions',
        },
    };

    const labels = t[language];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {labels.welcome} 👋
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        CROSS LINK ACCESS
                    </p>
                </div>
                <Button onClick={() => setCurrentView('compose')} className="gap-2">
                    <PenSquare size={18} />
                    {labels.newPost}
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {labels.connectedAccounts}
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{activeAccounts.length}</div>
                        <div className="flex gap-1 mt-2">
                            {activeAccounts.slice(0, 5).map((account) => (
                                <PlatformIcon key={account.id} platform={account.platform} size={20} />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {labels.scheduledPosts}
                        </CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{scheduledPosts.length}</div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {labels.totalPosts}
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{posts.filter(p => p.status === 'posted').length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Connected Accounts */}
            <Card>
                <CardHeader>
                    <CardTitle>{labels.connectedAccounts}</CardTitle>
                </CardHeader>
                <CardContent>
                    {activeAccounts.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400 mb-4">{labels.noAccounts}</p>
                            <Button variant="outline" onClick={() => setCurrentView('accounts')}>
                                {labels.connectAccount}
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeAccounts.map((account) => (
                                <div
                                    key={account.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <PlatformIcon platform={account.platform} size={40} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                            {account.displayName || account.username}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            @{account.username}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>{labels.quickActions}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="bluesky" onClick={() => setCurrentView('compose')}>
                            Bluesky に投稿
                        </Button>
                        <Button variant="youtube" onClick={() => setCurrentView('compose')}>
                            YouTube に投稿
                        </Button>
                        <Button variant="instagram" onClick={() => setCurrentView('compose')}>
                            Instagram に投稿
                        </Button>
                        <Button variant="threads" onClick={() => setCurrentView('compose')}>
                            Threads に投稿
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
