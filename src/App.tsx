import { useEffect } from 'react';
import { MainLayout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AccountManager } from './components/AccountManager';
import { PostComposer } from './components/PostComposer';
import { ScheduleCalendar } from './components/ScheduleCalendar';
import { Settings } from './components/Settings';
import { PostHistory } from './components/PostHistory';
import { useAppStore } from './stores';
import { schedulerService } from './services/scheduler';
import './index.css';

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

  // Start scheduler on mount
  useEffect(() => {
    schedulerService.start();
    return () => {
      schedulerService.stop();
    };
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'compose':
        return <PostComposer />;
      case 'accounts':
        return <AccountManager />;
      case 'schedule':
        return <ScheduleCalendar />;
      case 'history':
        return <PostHistory />;
      case 'settings':
        return <Settings />;
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
