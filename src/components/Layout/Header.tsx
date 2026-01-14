import React from 'react';
import { Moon, Sun, Bell } from 'lucide-react';
import { useAppStore } from '../../stores';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export const Header: React.FC = () => {
    const { theme, setTheme, sidebarCollapsed, language } = useAppStore();

    const toggleTheme = () => {
        if (theme === 'light') {
            setTheme('dark');
        } else if (theme === 'dark') {
            setTheme('system');
        } else {
            setTheme('light');
        }
    };

    const getThemeIcon = () => {
        if (theme === 'dark') return <Moon size={18} />;
        if (theme === 'light') return <Sun size={18} />;
        return <Sun size={18} className="opacity-50" />;
    };

    return (
        <header
            className={cn(
                'fixed top-0 right-0 z-30 h-16 transition-all duration-300',
                'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg',
                'border-b border-gray-200 dark:border-gray-800',
                'flex items-center justify-between px-6',
                sidebarCollapsed ? 'left-16' : 'left-64'
            )}
        >
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    {language === 'ja' ? 'クロスリンクアクセス' : 'Cross Link Access'}
                </h1>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                    {getThemeIcon()}
                </Button>
                <Button variant="ghost" size="icon">
                    <Bell size={18} />
                </Button>
            </div>
        </header>
    );
};
