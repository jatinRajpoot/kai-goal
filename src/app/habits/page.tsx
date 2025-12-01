'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { databases } from '@/lib/appwrite';
import { Query, ID, Permission, Role } from 'appwrite';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Habit } from '@/types';
import { Check, Flame, Plus, X, Trophy, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateStreaks, getLocalDateString, isDateToday } from '@/lib/habit-utils';

export default function HabitsPage() {
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [newHabit, setNewHabit] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

    // Generate last 7 days (including today)
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
    });

    const todayStr = getLocalDateString(new Date());

    const fetchHabits = useCallback(async () => {
        if (!dbId || !user) return;
        try {
            setHasError(false);
            const response = await databases.listDocuments(dbId, 'habits', [
                Query.equal('userId', user.$id),
            ]);
            setHabits(response.documents.map(doc => ({
                $id: doc.$id,
                title: doc.title,
                streak: doc.streak || 0,
                longestStreak: doc.longestStreak || 0,
                completedDates: doc.completedDates || [],
                userId: doc.userId
            } as Habit)));
        } catch (err) {
            console.error('Error fetching habits:', err);
            setHasError(true);
            showError('Failed to load habits. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [dbId, user, showError]);

    useEffect(() => {
        if (user && dbId) {
            fetchHabits();
        } else if (!dbId) {
            console.error('Missing Database ID');
            setLoading(false);
        }
    }, [user, dbId, fetchHabits]);

    const addHabit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHabit.trim() || !dbId || !user) return;

        setIsSubmitting(true);
        try {
            const initialStreak = { streak: 0, longestStreak: 0 };

            const doc = await databases.createDocument(dbId, 'habits', ID.unique(), {
                title: newHabit,
                userId: user.$id,
                streak: initialStreak.streak,
                longestStreak: initialStreak.longestStreak,
                completedDates: []
            }, [
                Permission.read(Role.user(user.$id)),
                Permission.update(Role.user(user.$id)),
                Permission.delete(Role.user(user.$id)),
            ]);

            const newHabitObj: Habit = {
                $id: doc.$id,
                title: doc.title,
                streak: doc.streak,
                longestStreak: doc.longestStreak,
                completedDates: doc.completedDates,
                userId: doc.userId
            };

            setHabits(prev => [...prev, newHabitObj]);
            setNewHabit('');
            setIsAdding(false);
            success('Habit created! Start building your streak! 🔥');
        } catch (err) {
            console.error('Error adding habit:', err);
            showError('Failed to create habit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleHabitDate = async (habit: Habit, date: Date) => {
        if (!dbId) return;

        const dateStr = getLocalDateString(date);

        // Strict Rule: Can only toggle TODAY
        if (!isDateToday(dateStr)) {
            return;
        }

        const isCompleted = habit.completedDates.includes(dateStr);
        let newCompletedDates = [...habit.completedDates];

        if (isCompleted) {
            newCompletedDates = newCompletedDates.filter(d => d !== dateStr);
        } else {
            newCompletedDates.push(dateStr);
        }

        // Robust Streak Calculation
        const { streak, longestStreak } = calculateStreaks(newCompletedDates);

        try {
            await databases.updateDocument(dbId, 'habits', habit.$id, {
                completedDates: newCompletedDates,
                streak: streak,
                longestStreak: longestStreak
            });

            // Update local state
            setHabits(prevHabits => prevHabits.map(h => h.$id === habit.$id ? {
                ...h,
                completedDates: newCompletedDates,
                streak,
                longestStreak
            } : h));

            if (!isCompleted) {
                success(`Great job! ${streak > 1 ? `${streak} day streak! 🔥` : 'Keep it up!'}`);
            }
        } catch (err) {
            console.error('Error updating habit:', err);
            showError('Failed to update habit. Please try again.');
        }
    };

    if (loading) {
        return <PageLoader text="Loading habits..." />;
    }

    if (hasError) {
        return (
            <div className="max-w-4xl mx-auto w-full">
                <EmptyState
                    icon={RefreshCw}
                    title="Failed to load habits"
                    description="We couldn't load your habits. Please check your connection and try again."
                    action={
                        <Button onClick={fetchHabits}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-foreground">Habits</h2>
                <Button onClick={() => setIsAdding(prev => !prev)}>
                    {isAdding ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {isAdding ? 'Cancel' : 'New Habit'}
                </Button>
            </div>

            {isAdding && (
                <Card className="p-5 animate-in fade-in slide-in-from-top-2">
                    <form onSubmit={addHabit} className="flex flex-col sm:flex-row gap-3">
                        <Input
                            value={newHabit}
                            onChange={(e) => setNewHabit(e.target.value)}
                            placeholder="Habit name (e.g., Read 30 mins)"
                            autoFocus
                            className="flex-1"
                        />
                        <Button type="submit" loading={isSubmitting}>Add</Button>
                    </form>
                </Card>
            )}

            <div className="space-y-4">
                {habits.map(habit => (
                    <Card key={habit.$id} className="p-5 sm:p-6 hover:shadow-md hover:translate-y-[-1px] transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                            <h3 className="font-semibold text-lg text-foreground">{habit.title}</h3>
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 rounded-full text-orange-600 dark:text-orange-400 text-sm shadow-sm">
                                    <Flame className="h-4 w-4 fill-current" />
                                    <span className="font-bold">{habit.streak} day{habit.streak !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-full text-yellow-600 dark:text-yellow-400 text-sm shadow-sm">
                                    <Trophy className="h-4 w-4 fill-current" />
                                    <span className="font-bold">Best: {habit.longestStreak || 0}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                            {days.map((date) => {
                                const dateStr = getLocalDateString(date);
                                const isCompleted = habit.completedDates.includes(dateStr);
                                const isToday = dateStr === todayStr;
                                const isPast = dateStr < todayStr;
                                const canInteract = isToday;

                                return (
                                    <div key={dateStr} className="flex flex-col items-center gap-1 sm:gap-2">
                                        <span className={cn(
                                            "text-xs truncate w-full text-center",
                                            isToday ? "font-bold text-foreground" : "text-muted-foreground"
                                        )}>
                                            {date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                                            <span className="hidden sm:inline">{date.toLocaleDateString('en-US', { weekday: 'short' }).slice(1)}</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => canInteract && toggleHabitDate(habit, date)}
                                            disabled={!canInteract}
                                            className={cn(
                                                "flex h-10 w-10 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition-all min-h-[44px] min-w-[44px]",
                                                canInteract ? "cursor-pointer" : "cursor-default opacity-80",
                                                isCompleted
                                                    ? "bg-primary dark:bg-primary-foreground text-primary-foreground dark:text-primary shadow-md"
                                                    : isPast
                                                        ? "bg-red-50 dark:bg-red-900/30 text-red-400 dark:text-red-400"
                                                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-muted-foreground",
                                                isToday && !isCompleted && "ring-2 ring-primary dark:ring-primary-foreground ring-offset-2 ring-offset-background"
                                            )}
                                            aria-label={`Toggle habit ${habit.title} for ${dateStr}, currently ${isCompleted ? 'Completed' : 'Not Completed'}`}
                                        >
                                            {isCompleted ? (
                                                <Check className="h-5 w-5" />
                                            ) : isPast ? (
                                                <X className="h-5 w-5" />
                                            ) : null}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                ))}
                {habits.length === 0 && !isAdding && (
                    <EmptyState
                        icon={Flame}
                        title="No habits yet"
                        description="Start building healthy habits and track your streaks!"
                        action={
                            <Button onClick={() => setIsAdding(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Habit
                            </Button>
                        }
                    />
                )}
            </div>
        </div>
    );
}
