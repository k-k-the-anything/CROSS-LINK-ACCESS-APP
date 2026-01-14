import React, { useState, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    Edit2,
    Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { useScheduleStore, usePostStore, useAppStore } from '../../stores';
import { cn } from '../../lib/utils';

// Calendar day component
const CalendarDay: React.FC<{
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    postCount: number;
    onClick: () => void;
}> = ({ date, isCurrentMonth, isToday, isSelected, postCount, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                'relative w-full aspect-square p-1 rounded-lg transition-all text-sm',
                isCurrentMonth
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-600',
                isToday && 'ring-2 ring-primary-500',
                isSelected && 'bg-primary-100 dark:bg-primary-900/30',
                !isSelected && 'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
        >
            <span className="block">{date.getDate()}</span>
            {postCount > 0 && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
                    {postCount}
                </span>
            )}
        </button>
    );
};

// Scheduled post item component
const ScheduledPostItem: React.FC<{
    postId: string;
    scheduledAt: Date;
    onEdit: () => void;
    onCancel: () => void;
}> = ({ postId, scheduledAt, onEdit, onCancel }) => {
    const { posts } = usePostStore();
    const { language } = useAppStore();
    const post = posts.find((p) => p.id === postId);

    if (!post) return null;

    const time = new Date(scheduledAt).toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock size={14} />
                <span>{time}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {post.content.substring(0, 50)}
                    {post.content.length > 50 && '...'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    {post.status === 'scheduled' ? (language === 'ja' ? '予約済み' : 'Scheduled') : post.status}
                </p>
            </div>
            <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={onEdit}>
                    <Edit2 size={14} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCancel}
                    className="text-red-500 hover:text-red-600"
                >
                    <Trash2 size={14} />
                </Button>
            </div>
        </div>
    );
};

// Main ScheduleCalendar component
export const ScheduleCalendar: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const { scheduledPosts, getScheduledPostsForDate, cancelScheduledPost } = useScheduleStore();
    const { language } = useAppStore();

    const t = {
        ja: {
            title: '予約投稿カレンダー',
            today: '今日',
            noScheduled: 'この日の予約投稿はありません',
            scheduledFor: '予約投稿',
            cancel: 'キャンセル',
            pendingPosts: '件の予約投稿',
        },
        en: {
            title: 'Schedule Calendar',
            today: 'Today',
            noScheduled: 'No scheduled posts for this day',
            scheduledFor: 'Scheduled for',
            cancel: 'Cancel',
            pendingPosts: 'scheduled posts',
        },
    };

    const labels = t[language];

    // Calendar navigation
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days: { date: Date; isCurrentMonth: boolean }[] = [];

        // Add days from previous month
        const startDayOfWeek = firstDay.getDay();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month, -i),
                isCurrentMonth: false,
            });
        }

        // Add days of current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true,
            });
        }

        // Add days from next month
        const remainingDays = 42 - days.length; // 6 rows * 7 days
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false,
            });
        }

        return days;
    }, [currentDate]);

    // Get post count for a date
    const getPostCountForDate = (date: Date): number => {
        return getScheduledPostsForDate(date).filter((sp) => sp.status === 'pending').length;
    };

    // Selected date's scheduled posts
    const selectedDatePosts = selectedDate
        ? getScheduledPostsForDate(selectedDate).filter((sp) => sp.status === 'pending')
        : [];

    const today = new Date();
    const isToday = (date: Date) =>
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

    const isSelected = (date: Date) =>
        selectedDate !== null &&
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();

    const monthYear = currentDate.toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
        year: 'numeric',
        month: 'long',
    });

    const weekDays = language === 'ja'
        ? ['日', '月', '火', '水', '木', '金', '土']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const pendingCount = scheduledPosts.filter((sp) => sp.status === 'pending').length;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{labels.title}</h2>
                    {pendingCount > 0 && (
                        <p className="text-gray-500 mt-1">
                            {pendingCount} {labels.pendingPosts}
                        </p>
                    )}
                </div>
                <Button variant="outline" onClick={goToToday}>
                    <CalendarIcon size={16} className="mr-2" />
                    {labels.today}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                                <ChevronLeft size={20} />
                            </Button>
                            <CardTitle>{monthYear}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                                <ChevronRight size={20} />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Week day headers */}
                        <div className="grid grid-cols-7 mb-2">
                            {weekDays.map((day, i) => (
                                <div
                                    key={day}
                                    className={cn(
                                        'text-center text-sm font-medium py-2',
                                        i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
                                    )}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map(({ date, isCurrentMonth }, index) => (
                                <CalendarDay
                                    key={index}
                                    date={date}
                                    isCurrentMonth={isCurrentMonth}
                                    isToday={isToday(date)}
                                    isSelected={isSelected(date)}
                                    postCount={getPostCountForDate(date)}
                                    onClick={() => setSelectedDate(date)}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Selected date details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {selectedDate
                                ? selectedDate.toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    weekday: 'short',
                                })
                                : labels.scheduledFor}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {selectedDate ? (
                            selectedDatePosts.length > 0 ? (
                                selectedDatePosts.map((sp) => (
                                    <ScheduledPostItem
                                        key={sp.id}
                                        postId={sp.postId}
                                        scheduledAt={sp.scheduledAt}
                                        onEdit={() => {
                                            // TODO: Implement edit
                                        }}
                                        onCancel={() => cancelScheduledPost(sp.id)}
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-8">
                                    {labels.noScheduled}
                                </p>
                            )
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-8">
                                {language === 'ja' ? '日付を選択してください' : 'Select a date'}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
