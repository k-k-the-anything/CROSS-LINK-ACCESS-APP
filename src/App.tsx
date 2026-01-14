import { useEffect } from 'react';
import { MainLayout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AccountManager } from './components/AccountManager';
import { PostComposer } from './components/PostComposer';
import { useAppStore } from './stores';
import './index.css';

// Placeholder components for views not yet implemented
const SchedulePlaceholder = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">予約投稿</h2>
    <p className="text-gray-500">予約投稿機能は Phase 3 で実装予定です。</p>
  </div>
);

const SettingsPlaceholder = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">設定</h2>
    <p className="text-gray-500">設定画面は後で実装予定です。</p>
  </div>
);

function App() {
  const { currentView, theme } = useAppStore();

  // Apply theme on mount and when theme changes
  useEffect(() => {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'compose':
        return <PostComposer />;
      case 'accounts':
        return <AccountManager />;
      case 'schedule':
        return <SchedulePlaceholder />;
      case 'settings':
        return <SettingsPlaceholder />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <MainLayout>
      {renderCurrentView()}
    </MainLayout>
  );
}

export default App;
