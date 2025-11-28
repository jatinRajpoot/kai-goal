'use client';

import React, { useState, useEffect } from 'react';
import { databases } from '@/lib/appwrite';
import { Query, ID, Permission, Role } from 'appwrite';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { Habit } from '@/types';
import { Check, Flame, Plus, X, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateStreaks, getLocalDateString, isDateToday } from '@/lib/habit-utils';

export default function HabitsPage() {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [newHabit, setNewHabit] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

    // Generate last 7 days (including today)
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
    });

    const todayStr = getLocalDateString(new Date());

    useEffect(() => {
        const fetchHabits = async () => {
            if (!dbId || !user) return;
            try {
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
            } catch (error) {
                console.error('Error fetching habits:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user && dbId) {
            fetchHabits();
        } else if (!dbId) {
            console.error('Missing Database ID');
            setLoading(false);
        }
    }, [user, dbId]);

    const addHabit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHabit.trim() || !dbId || !user) return;

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
        } catch (error) {
            console.error('Error adding habit:', error);
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
        } catch (error) {
            console.error('Error updating habit:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Habits</h2>
                <Button onClick={() => setIsAdding(prev => !prev)}>
                    {isAdding ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {isAdding ? 'Cancel' : 'New Habit'}
                </Button>
            </div>

            {isAdding && (
                <Card className="p-4 animate-in fade-in slide-in-from-top-2">
                    <form onSubmit={addHabit} className="flex gap-3">
                        <Input
                            value={newHabit}
                            onChange={(e) => setNewHabit(e.target.value)}
                            placeholder="Habit name (e.g., Read 30 mins)"
                            autoFocus
                        />
                        <Button type="submit">Add</Button>
                    </form>
                </Card>
            )}

            <div className="space-y-4">
                {habits.map(habit => (
                    <Card key={habit.$id} className="p-5 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-foreground">{habit.title}</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 rounded-full text-orange-600 dark:text-orange-400 text-sm">
                                    <Flame className="h-4 w-4 fill-current" />
                                    <span className="font-bold">{habit.streak} day streak</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 rounded-full text-yellow-600 dark:text-yellow-400 text-sm">
                                    <Trophy className="h-4 w-4 fill-current" />
                                    <span className="font-bold">Best: {habit.longestStreak || 0}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {days.map((date) => {
                                const dateStr = getLocalDateString(date);
                                const isCompleted = habit.completedDates.includes(dateStr);
                                const isToday = dateStr === todayStr;
                                const isPast = dateStr < todayStr;
                                const canInteract = isToday;

                                return (
                                    <div key={dateStr} className="flex flex-col items-center gap-2">
                                        <span className={cn("text-xs", isToday ? "font-bold text-primary" : "text-muted-foreground")}>
                                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => canInteract && toggleHabitDate(habit, date)}
                                            disabled={!canInteract}
                                            className={cn(
                                                "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                                                canInteract ? "cursor-pointer" : "cursor-default opacity-80",
                                                isCompleted
                                                    ? "bg-primary text-primary-foreground shadow-md"
                                                    : isPast
                                                        ? "bg-destructive/10 text-destructive border border-destructive/20"
                                                        : "bg-secondary hover:bg-secondary/80 text-muted-foreground",
                                                isToday && !isCompleted && "ring-2 ring-primary ring-offset-2 ring-offset-background"
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
                    <Card className="flex flex-col items-center justify-center py-12">
                        <Flame className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-lg">No habits yet.</p>
                        <p className="text-muted-foreground/70 text-sm">Start building one!</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
