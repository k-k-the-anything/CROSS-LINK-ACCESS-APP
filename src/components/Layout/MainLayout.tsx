import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../../stores';
import { cn } from '../../lib/utils';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { sidebarCollapsed } = useAppStore();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Sidebar />
            <Header />
            <main
                className={cn(
                    'pt-16 min-h-screen transition-all duration-300',
                    sidebarCollapsed ? 'pl-16' : 'pl-64'
                )}
            >
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
};
