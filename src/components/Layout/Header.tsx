import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Monitor, Bell, ChevronDown, Check } from 'lucide-react';
import { useAppStore } from '../../stores';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

// Theme option type
type ThemeOption = {
    id: 'light' | 'dark' | 'system';
    icon: React.ReactNode;
    label: string;
    labelEn: string;
};

const themeOptions: ThemeOption[] = [
    { id: 'light', icon: <Sun size={16} />, label: 'ライト', labelEn: 'Light' },
    { id: 'dark', icon: <Moon size={16} />, label: 'ダーク', labelEn: 'Dark' },
    { id: 'system', icon: <Monitor size={16} />, label: 'システム', labelEn: 'System' },
];

export const Header: React.FC = () => {
    const { theme, setTheme, sidebarCollapsed, language } = useAppStore();
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowThemeMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentTheme = themeOptions.find((t) => t.id === theme) || themeOptions[2];

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
                {/* Theme Dropdown */}
                <div className="relative" ref={menuRef}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowThemeMenu(!showThemeMenu)}
                        className="flex items-center gap-2"
                    >
                        <span className="transition-transform duration-300">
                            {currentTheme.icon}
                        </span>
                        <span className="text-sm hidden sm:inline">
                            {language === 'ja' ? currentTheme.label : currentTheme.labelEn}
                        </span>
                        <ChevronDown
                            size={14}
                            className={cn(
                                'transition-transform duration-200',
                                showThemeMenu && 'rotate-180'
                            )}
                        />
                    </Button>

                    {/* Dropdown Menu */}
                    <div
                        className={cn(
                            'absolute right-0 top-full mt-2 w-40 py-1',
                            'bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700',
                            'transition-all duration-200 origin-top-right',
                            showThemeMenu
                                ? 'opacity-100 scale-100 visible'
                                : 'opacity-0 scale-95 invisible'
                        )}
                    >
                        {themeOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => {
                                    setTheme(option.id);
                                    setShowThemeMenu(false);
                                }}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                                    theme === option.id
                                        ? 'text-primary-600 dark:text-primary-400 font-medium'
                                        : 'text-gray-700 dark:text-gray-300'
                                )}
                            >
                                {option.icon}
                                <span className="flex-1 text-left">
                                    {language === 'ja' ? option.label : option.labelEn}
                                </span>
                                {theme === option.id && (
                                    <Check size={14} className="text-primary-500" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                    <Bell size={18} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Button>
            </div>
        </header>
    );
};
