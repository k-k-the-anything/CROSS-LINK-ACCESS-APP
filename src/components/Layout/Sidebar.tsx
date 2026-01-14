import React from 'react';
import {
    LayoutDashboard,
    PenSquare,
    Users,
    Calendar,
    Settings,
    ChevronLeft,
    ChevronRight,
    Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../stores';
import { Button } from '../ui/Button';

type ViewType = 'dashboard' | 'compose' | 'accounts' | 'schedule' | 'settings';

interface NavItem {
    id: ViewType;
    label: string;
    labelEn: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { id: 'dashboard', label: 'ダッシュボード', labelEn: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'compose', label: '新規投稿', labelEn: 'New Post', icon: <PenSquare size={20} /> },
    { id: 'accounts', label: 'アカウント', labelEn: 'Accounts', icon: <Users size={20} /> },
    { id: 'schedule', label: '予約投稿', labelEn: 'Schedule', icon: <Calendar size={20} /> },
    { id: 'settings', label: '設定', labelEn: 'Settings', icon: <Settings size={20} /> },
];

export const Sidebar: React.FC = () => {
    const { sidebarCollapsed, toggleSidebar, currentView, setCurrentView, language } = useAppStore();

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out',
                'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
                'flex flex-col',
                sidebarCollapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <Zap size={18} className="text-white" />
                    </div>
                    {!sidebarCollapsed && (
                        <span className="font-bold text-lg bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
                            CROSS LINK
                        </span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id)}
                        className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                            'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                            currentView === item.id && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium',
                            sidebarCollapsed && 'justify-center'
                        )}
                    >
                        {item.icon}
                        {!sidebarCollapsed && (
                            <span>{language === 'ja' ? item.label : item.labelEn}</span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Collapse Toggle */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className={cn('w-full', sidebarCollapsed && 'px-0')}
                >
                    {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    {!sidebarCollapsed && (
                        <span className="ml-2">{language === 'ja' ? '折りたたむ' : 'Collapse'}</span>
                    )}
                </Button>
            </div>
        </aside>
    );
};
