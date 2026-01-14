import React, { useState } from 'react';
import { Plus, Trash2, RefreshCw, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAccountStore, useAppStore } from '../../stores';
import { PLATFORM_CONFIGS, PlatformType, Account } from '../../types';
import { blueskyService } from '../../services';
import { cn } from '../../lib/utils';

// Platform icon component
const PlatformIcon: React.FC<{ platform: PlatformType; size?: number }> = ({ platform, size = 32 }) => {
    const config = PLATFORM_CONFIGS[platform];
    return (
        <div
            className="flex items-center justify-center rounded-lg"
            style={{ backgroundColor: config.color, width: size, height: size }}
        >
            <span className="text-white text-sm font-bold">
                {config.name.charAt(0)}
            </span>
        </div>
    );
};

// Platform tab component  
const PlatformTab: React.FC<{
    platform: PlatformType;
    isActive: boolean;
    onClick: () => void;
}> = ({ platform, isActive, onClick }) => {
    const config = PLATFORM_CONFIGS[platform];
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                isActive
                    ? 'bg-gray-100 dark:bg-gray-800 font-medium'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
            )}
        >
            <PlatformIcon platform={platform} size={24} />
            <span>{config.name}</span>
        </button>
    );
};

// Bluesky login form
const BlueskyLoginForm: React.FC<{
    onSuccess: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
}> = ({ onSuccess }) => {
    const [handle, setHandle] = useState('');
    const [appPassword, setAppPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { language } = useAppStore();

    const t = {
        ja: {
            handle: 'ハンドル（例: user.bsky.social）',
            appPassword: 'アプリパスワード',
            connect: '接続',
            connecting: '接続中...',
            howToGetPassword: 'アプリパスワードの取得方法',
            errorPrefix: 'エラー: ',
        },
        en: {
            handle: 'Handle (e.g., user.bsky.social)',
            appPassword: 'App Password',
            connect: 'Connect',
            connecting: 'Connecting...',
            howToGetPassword: 'How to get App Password',
            errorPrefix: 'Error: ',
        },
    };

    const labels = t[language];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const result = await blueskyService.authenticate(handle, appPassword);

        if (result.success) {
            onSuccess({
                platform: 'bluesky',
                platformUserId: result.userId,
                username: result.username || handle,
                displayName: result.displayName,
                isActive: true,
                tokenExpiresAt: undefined,
                lastSyncAt: new Date(),
            });
            setHandle('');
            setAppPassword('');
        } else {
            setError(result.error || 'Authentication failed');
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Input
                    type="text"
                    placeholder={labels.handle}
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    disabled={isLoading}
                    required
                />
            </div>
            <div>
                <Input
                    type="password"
                    placeholder={labels.appPassword}
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    disabled={isLoading}
                    required
                />
            </div>
            {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle size={16} />
                    <span>{labels.errorPrefix}{error}</span>
                </div>
            )}
            <div className="flex items-center justify-between">
                <a
                    href="https://bsky.app/settings/app-passwords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-500 hover:underline flex items-center gap-1"
                >
                    {labels.howToGetPassword}
                    <ExternalLink size={12} />
                </a>
                <Button type="submit" variant="bluesky" disabled={isLoading}>
                    {isLoading ? labels.connecting : labels.connect}
                </Button>
            </div>
        </form>
    );
};

// Account card component
const AccountCard: React.FC<{
    account: Account;
    onRemove: () => void;
}> = ({ account, onRemove }) => {
    const config = PLATFORM_CONFIGS[account.platform];
    const { language } = useAppStore();

    const t = {
        ja: {
            connected: '接続済み',
            remove: '削除',
            lastSync: '最終同期',
        },
        en: {
            connected: 'Connected',
            remove: 'Remove',
            lastSync: 'Last sync',
        },
    };

    const labels = t[language];

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                    <PlatformIcon platform={account.platform} size={48} />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {account.displayName || account.username}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            @{account.username}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                            <Check size={12} className="text-green-500" />
                            <span className="text-xs text-green-500">{labels.connected}</span>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onRemove}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                        <Trash2 size={18} />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// Main AccountManager component
export const AccountManager: React.FC = () => {
    const [activePlatform, setActivePlatform] = useState<PlatformType>('bluesky');
    const [showAddForm, setShowAddForm] = useState(false);
    const { accounts, addAccount, removeAccount } = useAccountStore();
    const { language } = useAppStore();

    const platforms: PlatformType[] = ['bluesky', 'youtube', 'instagram', 'threads', 'tiktok'];

    const t = {
        ja: {
            title: 'アカウント管理',
            description: 'SNSアカウントを接続して、クロスポストを有効にしましょう',
            addAccount: 'アカウントを追加',
            cancel: 'キャンセル',
            noAccounts: 'まだアカウントが接続されていません',
            connectFirst: '上の「アカウントを追加」ボタンから始めましょう',
            comingSoon: '近日対応予定',
        },
        en: {
            title: 'Account Manager',
            description: 'Connect your SNS accounts to enable cross-posting',
            addAccount: 'Add Account',
            cancel: 'Cancel',
            noAccounts: 'No accounts connected yet',
            connectFirst: 'Start by clicking "Add Account" above',
            comingSoon: 'Coming soon',
        },
    };

    const labels = t[language];

    const platformAccounts = accounts.filter((a) => a.platform === activePlatform);

    const handleAddAccount = (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newAccount: Account = {
            ...accountData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        addAccount(newAccount);
        setShowAddForm(false);
    };

    const renderAddForm = () => {
        switch (activePlatform) {
            case 'bluesky':
                return <BlueskyLoginForm onSuccess={handleAddAccount} />;
            case 'youtube':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
                                {language === 'ja' ? 'YouTube Data API v3 設定が必要です' : 'YouTube Data API v3 Setup Required'}
                            </h4>
                            <ol className="text-sm text-red-600 dark:text-red-400 space-y-1 list-decimal ml-4">
                                <li>{language === 'ja' ? 'Google Cloud Console でプロジェクトを作成' : 'Create a project in Google Cloud Console'}</li>
                                <li>{language === 'ja' ? 'YouTube Data API v3 を有効化' : 'Enable YouTube Data API v3'}</li>
                                <li>{language === 'ja' ? 'OAuth 2.0 クライアント ID を作成' : 'Create OAuth 2.0 Client ID'}</li>
                            </ol>
                        </div>
                        <a
                            href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-red-500 hover:underline"
                        >
                            Google Cloud Console を開く
                            <ExternalLink size={12} />
                        </a>
                    </div>
                );
            case 'instagram':
            case 'threads':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">
                                {language === 'ja' ? 'Meta 開発者設定が必要です' : 'Meta Developer Setup Required'}
                            </h4>
                            <ol className="text-sm text-purple-600 dark:text-purple-400 space-y-1 list-decimal ml-4">
                                <li>{language === 'ja' ? 'Meta for Developers でアプリを作成' : 'Create an app in Meta for Developers'}</li>
                                <li>{language === 'ja' ? 'Instagram Graph API を追加' : 'Add Instagram Graph API'}</li>
                                <li>{language === 'ja' ? 'ビジネスアカウントと Facebook ページを連携' : 'Link Business account and Facebook Page'}</li>
                            </ol>
                        </div>
                        <a
                            href="https://developers.facebook.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-purple-500 hover:underline"
                        >
                            Meta for Developers を開く
                            <ExternalLink size={12} />
                        </a>
                    </div>
                );
            case 'tiktok':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {language === 'ja' ? 'TikTok Developer 設定が必要です' : 'TikTok Developer Setup Required'}
                            </h4>
                            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal ml-4">
                                <li>{language === 'ja' ? 'TikTok for Developers で登録' : 'Register at TikTok for Developers'}</li>
                                <li>{language === 'ja' ? 'Content Posting API を申請' : 'Apply for Content Posting API'}</li>
                                <li>{language === 'ja' ? 'アプリ審査を通過（審査中は非公開投稿のみ）' : 'Pass app review (private posts only during review)'}</li>
                            </ol>
                        </div>
                        <a
                            href="https://developers.tiktok.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:underline"
                        >
                            TikTok for Developers を開く
                            <ExternalLink size={12} />
                        </a>
                    </div>
                );
            default:
                return (
                    <div className="text-center py-8 text-gray-500">
                        <p>{PLATFORM_CONFIGS[activePlatform].name} {labels.comingSoon}</p>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{labels.title}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{labels.description}</p>
                </div>
                <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    variant={showAddForm ? 'outline' : 'default'}
                >
                    {showAddForm ? labels.cancel : (
                        <>
                            <Plus size={18} className="mr-2" />
                            {labels.addAccount}
                        </>
                    )}
                </Button>
            </div>

            {/* Platform Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {platforms.map((platform) => (
                    <PlatformTab
                        key={platform}
                        platform={platform}
                        isActive={activePlatform === platform}
                        onClick={() => {
                            setActivePlatform(platform);
                            setShowAddForm(false);
                        }}
                    />
                ))}
            </div>

            {/* Add Form */}
            {showAddForm && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PlatformIcon platform={activePlatform} size={24} />
                            {PLATFORM_CONFIGS[activePlatform].name}
                        </CardTitle>
                        <CardDescription>
                            {activePlatform === 'bluesky' && 'アプリパスワードを使用して安全に接続します'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderAddForm()}
                    </CardContent>
                </Card>
            )}

            {/* Connected Accounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platformAccounts.map((account) => (
                    <AccountCard
                        key={account.id}
                        account={account}
                        onRemove={() => removeAccount(account.id)}
                    />
                ))}
            </div>

            {platformAccounts.length === 0 && !showAddForm && (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <PlatformIcon platform={activePlatform} size={48} />
                        <h3 className="mt-4 font-medium text-gray-900 dark:text-white">{labels.noAccounts}</h3>
                        <p className="mt-2 text-sm text-gray-500">{labels.connectFirst}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
