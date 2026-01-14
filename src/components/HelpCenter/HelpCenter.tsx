import React, { useState } from 'react';
import {
    HelpCircle,
    Keyboard,
    Book,
    ExternalLink,
    ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAppStore } from '../../stores';
import { useShortcutsHelp, formatShortcut } from '../../hooks';
import { cn } from '../../lib/utils';

// Section component
const HelpSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}> = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
                {icon}
                <span className="flex-1 font-medium text-gray-900 dark:text-white">{title}</span>
                <ChevronRight
                    size={18}
                    className={cn(
                        'text-gray-400 transition-transform',
                        isOpen && 'rotate-90'
                    )}
                />
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};

// Main HelpCenter component
export const HelpCenter: React.FC = () => {
    const { language } = useAppStore();
    const { shortcuts, getDescription } = useShortcutsHelp();

    const t = {
        ja: {
            title: 'ヘルプ',
            description: 'アプリケーションの使い方を確認できます',
            shortcuts: 'キーボードショートカット',
            gettingStarted: 'はじめに',
            platforms: 'プラットフォーム連携',
            faq: 'よくある質問',
            contact: 'お問い合わせ',
            gettingStartedContent: {
                step1: '1. アカウントを接続',
                step1Desc: 'サイドバーの「アカウント」から各プラットフォームを接続します',
                step2: '2. 投稿を作成',
                step2Desc: '「新規投稿」で投稿内容を入力し、投稿先を選択します',
                step3: '3. 投稿または予約',
                step3Desc: '今すぐ投稿するか、カレンダーで予約投稿を設定できます',
            },
            platformsContent: {
                bluesky: 'Bluesky: App Password で認証',
                youtube: 'YouTube: Google OAuth で連携',
                instagram: 'Instagram: Meta Business Suite で連携',
                threads: 'Threads: Instagram 経由で連携',
                tiktok: 'TikTok: Developer Portal で API 設定',
                x: 'X (Twitter): Developer Portal で OAuth 設定',
            },
            faqContent: {
                q1: 'Q: 投稿が失敗する場合は？',
                a1: 'A: 各プラットフォームの API レート制限を確認してください。また、認証トークンの有効期限が切れている可能性があります。',
                q2: 'Q: 予約投稿はオフラインでも動作しますか？',
                a2: 'A: いいえ、アプリケーションが起動している必要があります。',
                q3: 'Q: 対応メディアフォーマットは？',
                a3: 'A: 画像: JPEG, PNG, GIF / 動画: MP4',
            },
        },
        en: {
            title: 'Help',
            description: 'Learn how to use the application',
            shortcuts: 'Keyboard Shortcuts',
            gettingStarted: 'Getting Started',
            platforms: 'Platform Integration',
            faq: 'FAQ',
            contact: 'Contact',
            gettingStartedContent: {
                step1: '1. Connect Accounts',
                step1Desc: 'Connect your platforms from "Accounts" in the sidebar',
                step2: '2. Create a Post',
                step2Desc: 'Use "New Post" to compose content and select destinations',
                step3: '3. Post or Schedule',
                step3Desc: 'Post immediately or schedule using the calendar',
            },
            platformsContent: {
                bluesky: 'Bluesky: Authenticate with App Password',
                youtube: 'YouTube: Connect with Google OAuth',
                instagram: 'Instagram: Connect via Meta Business Suite',
                threads: 'Threads: Connect via Instagram',
                tiktok: 'TikTok: Configure API in Developer Portal',
                x: 'X (Twitter): Configure OAuth in Developer Portal',
            },
            faqContent: {
                q1: 'Q: What if posting fails?',
                a1: 'A: Check API rate limits for each platform. Also, authentication tokens may have expired.',
                q2: 'Q: Do scheduled posts work offline?',
                a2: 'A: No, the application must be running.',
                q3: 'Q: What media formats are supported?',
                a3: 'A: Images: JPEG, PNG, GIF / Videos: MP4',
            },
        },
    };

    const labels = t[language];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{labels.title}</h2>
                <p className="text-gray-500 mt-1">{labels.description}</p>
            </div>

            <div className="space-y-3">
                {/* Keyboard Shortcuts */}
                <HelpSection
                    title={labels.shortcuts}
                    icon={<Keyboard size={20} className="text-blue-500" />}
                    defaultOpen
                >
                    <div className="grid gap-2">
                        {shortcuts.map((shortcut, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {getDescription(shortcut)}
                                </span>
                                <kbd className="px-2 py-1 text-xs font-mono bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                                    {formatShortcut(shortcut)}
                                </kbd>
                            </div>
                        ))}
                    </div>
                </HelpSection>

                {/* Getting Started */}
                <HelpSection
                    title={labels.gettingStarted}
                    icon={<Book size={20} className="text-green-500" />}
                >
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                                {labels.gettingStartedContent.step1}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                                {labels.gettingStartedContent.step1Desc}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                                {labels.gettingStartedContent.step2}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                                {labels.gettingStartedContent.step2Desc}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                                {labels.gettingStartedContent.step3}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                                {labels.gettingStartedContent.step3Desc}
                            </p>
                        </div>
                    </div>
                </HelpSection>

                {/* Platform Integration */}
                <HelpSection
                    title={labels.platforms}
                    icon={<ExternalLink size={20} className="text-purple-500" />}
                >
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li>• {labels.platformsContent.bluesky}</li>
                        <li>• {labels.platformsContent.youtube}</li>
                        <li>• {labels.platformsContent.instagram}</li>
                        <li>• {labels.platformsContent.threads}</li>
                        <li>• {labels.platformsContent.tiktok}</li>
                        <li>• {labels.platformsContent.x}</li>
                    </ul>
                </HelpSection>

                {/* FAQ */}
                <HelpSection
                    title={labels.faq}
                    icon={<HelpCircle size={20} className="text-orange-500" />}
                >
                    <div className="space-y-4">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {labels.faqContent.q1}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">{labels.faqContent.a1}</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {labels.faqContent.q2}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">{labels.faqContent.a2}</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {labels.faqContent.q3}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">{labels.faqContent.a3}</p>
                        </div>
                    </div>
                </HelpSection>
            </div>

            {/* Version info */}
            <div className="text-center text-xs text-gray-400 pt-4">
                CROSS LINK ACCESS v1.0.0
            </div>
        </div>
    );
};
