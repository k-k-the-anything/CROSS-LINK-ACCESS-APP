import React, { useState } from 'react';
import {
    Sun,
    Moon,
    Monitor,
    Globe,
    Bell,
    Shield,
    Database,
    Trash2,
    RefreshCw,
    Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAppStore, useAccountStore, usePostStore, useScheduleStore } from '../../stores';
import { cn } from '../../lib/utils';

// Setting section component
const SettingSection: React.FC<{
    title: string;
    description?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, description, icon, children }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                {icon}
                {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
    </Card>
);

// Theme selector component
const ThemeSelector: React.FC<{
    value: 'light' | 'dark' | 'system';
    onChange: (theme: 'light' | 'dark' | 'system') => void;
}> = ({ value, onChange }) => {
    const themes: { id: 'light' | 'dark' | 'system'; icon: React.ReactNode; label: string }[] = [
        { id: 'light', icon: <Sun size={18} />, label: 'ライト' },
        { id: 'dark', icon: <Moon size={18} />, label: 'ダーク' },
        { id: 'system', icon: <Monitor size={18} />, label: 'システム' },
    ];

    return (
        <div className="flex gap-2">
            {themes.map((t) => (
                <button
                    key={t.id}
                    onClick={() => onChange(t.id)}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all',
                        value === t.id
                            ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                >
                    {t.icon}
                    <span className="text-sm">{t.label}</span>
                    {value === t.id && <Check size={14} className="text-primary-500" />}
                </button>
            ))}
        </div>
    );
};

// Language selector component
const LanguageSelector: React.FC<{
    value: 'ja' | 'en';
    onChange: (lang: 'ja' | 'en') => void;
}> = ({ value, onChange }) => {
    const languages: { id: 'ja' | 'en'; label: string; flag: string }[] = [
        { id: 'ja', label: '日本語', flag: '🇯🇵' },
        { id: 'en', label: 'English', flag: '🇺🇸' },
    ];

    return (
        <div className="flex gap-2">
            {languages.map((lang) => (
                <button
                    key={lang.id}
                    onClick={() => onChange(lang.id)}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all',
                        value === lang.id
                            ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                >
                    <span>{lang.flag}</span>
                    <span className="text-sm">{lang.label}</span>
                </button>
            ))}
        </div>
    );
};

// Toggle switch component
const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
}> = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between">
        <div>
            <p className="font-medium text-gray-900 dark:text-white">{label}</p>
            {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        <button
            onClick={() => onChange(!checked)}
            className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
            )}
        >
            <span
                className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    checked ? 'translate-x-7' : 'translate-x-1'
                )}
            />
        </button>
    </div>
);

// Main Settings component
export const Settings: React.FC = () => {
    const { theme, setTheme, language, setLanguage } = useAppStore();
    const { accounts } = useAccountStore();
    const { posts } = usePostStore();
    const { scheduledPosts } = useScheduleStore();

    const [notifications, setNotifications] = useState(true);
    const [autoSaveDrafts, setAutoSaveDrafts] = useState(true);
    const [confirmBeforePost, setConfirmBeforePost] = useState(true);

    const t = {
        ja: {
            title: '設定',
            description: 'アプリケーションの設定を管理します',
            appearance: '外観',
            appearanceDesc: 'テーマと言語の設定',
            theme: 'テーマ',
            language: '言語',
            notifications: '通知',
            notificationsDesc: '通知の設定を管理します',
            enableNotifications: '通知を有効にする',
            enableNotificationsDesc: '投稿完了やエラー時に通知を受け取ります',
            posting: '投稿設定',
            postingDesc: '投稿に関する設定',
            autoSaveDrafts: '下書きを自動保存',
            autoSaveDraftsDesc: '投稿作成中の内容を自動で保存します',
            confirmBeforePost: '投稿前に確認',
            confirmBeforePostDesc: '投稿を送信する前に確認ダイアログを表示します',
            data: 'データ管理',
            dataDesc: 'アプリケーションデータの管理',
            connectedAccounts: '接続済みアカウント',
            totalPosts: '投稿数',
            scheduledPosts: '予約投稿数',
            clearData: 'データをクリア',
            clearDataDesc: 'すべてのローカルデータを削除します',
            version: 'バージョン',
        },
        en: {
            title: 'Settings',
            description: 'Manage application settings',
            appearance: 'Appearance',
            appearanceDesc: 'Theme and language settings',
            theme: 'Theme',
            language: 'Language',
            notifications: 'Notifications',
            notificationsDesc: 'Manage notification settings',
            enableNotifications: 'Enable notifications',
            enableNotificationsDesc: 'Receive notifications for post completion and errors',
            posting: 'Posting Settings',
            postingDesc: 'Settings related to posting',
            autoSaveDrafts: 'Auto-save drafts',
            autoSaveDraftsDesc: 'Automatically save content while composing posts',
            confirmBeforePost: 'Confirm before posting',
            confirmBeforePostDesc: 'Show confirmation dialog before sending posts',
            data: 'Data Management',
            dataDesc: 'Manage application data',
            connectedAccounts: 'Connected accounts',
            totalPosts: 'Total posts',
            scheduledPosts: 'Scheduled posts',
            clearData: 'Clear Data',
            clearDataDesc: 'Delete all local data',
            version: 'Version',
        },
    };

    const labels = t[language];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{labels.title}</h2>
                <p className="text-gray-500 mt-1">{labels.description}</p>
            </div>

            <div className="grid gap-6">
                {/* Appearance */}
                <SettingSection
                    title={labels.appearance}
                    description={labels.appearanceDesc}
                    icon={<Sun size={20} className="text-yellow-500" />}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {labels.theme}
                            </label>
                            <ThemeSelector value={theme} onChange={setTheme} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {labels.language}
                            </label>
                            <LanguageSelector value={language} onChange={setLanguage} />
                        </div>
                    </div>
                </SettingSection>

                {/* Notifications */}
                <SettingSection
                    title={labels.notifications}
                    description={labels.notificationsDesc}
                    icon={<Bell size={20} className="text-blue-500" />}
                >
                    <ToggleSwitch
                        checked={notifications}
                        onChange={setNotifications}
                        label={labels.enableNotifications}
                        description={labels.enableNotificationsDesc}
                    />
                </SettingSection>

                {/* Posting */}
                <SettingSection
                    title={labels.posting}
                    description={labels.postingDesc}
                    icon={<Shield size={20} className="text-green-500" />}
                >
                    <div className="space-y-4">
                        <ToggleSwitch
                            checked={autoSaveDrafts}
                            onChange={setAutoSaveDrafts}
                            label={labels.autoSaveDrafts}
                            description={labels.autoSaveDraftsDesc}
                        />
                        <ToggleSwitch
                            checked={confirmBeforePost}
                            onChange={setConfirmBeforePost}
                            label={labels.confirmBeforePost}
                            description={labels.confirmBeforePostDesc}
                        />
                    </div>
                </SettingSection>

                {/* Data Management */}
                <SettingSection
                    title={labels.data}
                    description={labels.dataDesc}
                    icon={<Database size={20} className="text-purple-500" />}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {accounts.length}
                                </p>
                                <p className="text-xs text-gray-500">{labels.connectedAccounts}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {posts.length}
                                </p>
                                <p className="text-xs text-gray-500">{labels.totalPosts}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {scheduledPosts.filter((s) => s.status === 'pending').length}
                                </p>
                                <p className="text-xs text-gray-500">{labels.scheduledPosts}</p>
                            </div>
                        </div>
                        <Button variant="outline" className="text-red-500 hover:text-red-600">
                            <Trash2 size={16} className="mr-2" />
                            {labels.clearData}
                        </Button>
                    </div>
                </SettingSection>

                {/* Version */}
                <div className="text-center text-sm text-gray-400">
                    <p>CROSS LINK ACCESS {labels.version} 1.0.0</p>
                </div>
            </div>
        </div>
    );
};
