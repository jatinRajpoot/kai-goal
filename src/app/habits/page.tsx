'use client';

import React, { useState, useEffect } from 'react';
import { databases } from '@/lib/appwrite';
import { Query, ID, Permission, Role } from 'appwrite';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { Habit } from '@/types';
import { Check, Flame, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HabitsPage() {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [newHabit, setNewHabit] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    // Generate last 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
    });

    useEffect(() => {
        if (user) {
            fetchHabits();
        }
    }, [user]);

    const fetchHabits = async () => {
        try {
            const response = await databases.listDocuments(dbId, 'habits', [
                Query.equal('userId', user!.$id),
            ]);
            setHabits(response.documents.map(doc => ({
                $id: doc.$id,
                title: doc.title,
                streak: doc.streak || 0,
                completedDates: doc.completedDates || [],
                userId: doc.userId
            } as Habit)));
        } catch (error) {
            console.error('Error fetching habits:', error);
        } finally {
            setLoading(false);
        }
    };

    const addHabit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHabit.trim()) return;

        try {
            await databases.createDocument(dbId, 'habits', ID.unique(), {
                title: newHabit,
                userId: user!.$id,
                streak: 0,
                completedDates: []
            }, [
                Permission.read(Role.user(user!.$id)),
                Permission.update(Role.user(user!.$id)),
                Permission.delete(Role.user(user!.$id)),
            ]);
            setNewHabit('');
            setIsAdding(false);
            fetchHabits();
        } catch (error) {
            console.error('Error adding habit:', error);
        }
    };

    const toggleHabitDate = async (habit: Habit, date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        const isCompleted = habit.completedDates.includes(dateStr);

        let newCompletedDates = [...habit.completedDates];
        if (isCompleted) {
            newCompletedDates = newCompletedDates.filter(d => d !== dateStr);
        } else {
            newCompletedDates.push(dateStr);
        }

        // Simple streak calculation: consecutive days ending today or yesterday
        // This is a simplified version. Real streak logic is more complex.
        // For MVP, let's just count consecutive days backwards from today.
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Sort dates desc
        const sortedDates = [...newCompletedDates].sort().reverse();

        if (sortedDates.includes(today)) {
            streak = 1;
            let checkDate = new Date();
            while (true) {
                checkDate.setDate(checkDate.getDate() - 1);
                const checkStr = checkDate.toISOString().split('T')[0];
                if (sortedDates.includes(checkStr)) {
                    streak++;
                } else {
                    break;
                }
            }
        } else if (sortedDates.includes(yesterday)) {
            // If not done today but done yesterday, streak is kept (but not incremented for today)
            // Actually, usually streak is "current streak". If you missed today, is it 0? 
            // Often apps allow "today" to be pending without breaking streak.
            // Let's count backwards from yesterday.
            streak = 0; // Reset if not done today? No, that's harsh.
            // Let's count from yesterday backwards.
            let checkDate = new Date();
            checkDate.setDate(checkDate.getDate() - 1); // Start checking from yesterday
            if (sortedDates.includes(yesterday)) {
                streak = 1;
                while (true) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    const checkStr = checkDate.toISOString().split('T')[0];
                    if (sortedDates.includes(checkStr)) {
                        streak++;
                    } else {
                        break;
                    }
                }
            }
        }

        try {
            await databases.updateDocument(dbId, 'habits', habit.$id, {
                completedDates: newCompletedDates,
                streak: streak
            });

            // Optimistic update
            setHabits(habits.map(h => h.$id === habit.$id ? { ...h, completedDates: newCompletedDates, streak } : h));
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
                <Button onClick={() => setIsAdding(!isAdding)}>
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
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 rounded-full text-orange-600 dark:text-orange-400 text-sm">
                                <Flame className="h-4 w-4 fill-current" />
                                <span className="font-bold">{habit.streak} day streak</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {days.map((date, i) => {
                                const dateStr = date.toISOString().split('T')[0];
                                const isCompleted = habit.completedDates.includes(dateStr);
                                const isToday = i === 6;

                                return (
                                    <div key={dateStr} className="flex flex-col items-center gap-2">
                                        <span className={cn("text-xs", isToday ? "font-bold text-primary" : "text-muted-foreground")}>
                                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </span>
                                        <button
                                            onClick={() => toggleHabitDate(habit, date)}
                                            className={cn(
                                                "flex h-10 w-10 items-center justify-center rounded-full transition-all cursor-pointer",
                                                isCompleted
                                                    ? "bg-primary text-primary-foreground shadow-md"
                                                    : "bg-secondary hover:bg-secondary/80 text-muted-foreground",
                                                isToday && !isCompleted && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                            )}
                                        >
                                            {isCompleted && <Check className="h-5 w-5" />}
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
