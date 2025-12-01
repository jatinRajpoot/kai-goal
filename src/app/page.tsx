'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Task, Habit } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { CheckCircle2, Circle, Flame, RefreshCw, Calendar, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function Dashboard() {
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);
    const [hasError, setHasError] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        if (!user) return;
        
        try {
            setHasError(false);
            const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

            const tasksResponse = await databases.listDocuments(
                dbId,
                'tasks',
                [
                    Query.equal('userId', user.$id),
                    Query.equal('isCompleted', false),
                    Query.orderAsc('dueDate'),
                    Query.limit(100)
                ]
            );

            const today = new Date();
            today.setHours(23, 59, 59, 999);

            const dueTasks = tasksResponse.documents.map(doc => ({
                $id: doc.$id,
                title: doc.title,
                isCompleted: doc.isCompleted,
                dueDate: doc.dueDate,
                userId: doc.userId,
            } as Task)).filter(task => {
                const dueDate = new Date(task.dueDate);
                return dueDate <= today;
            });

            setTasks(dueTasks);

            const habitsResponse = await databases.listDocuments(
                dbId,
                'habits',
                [
                    Query.equal('userId', user.$id),
                    Query.limit(6)
                ]
            );

            setHabits(habitsResponse.documents.map(doc => ({
                $id: doc.$id,
                title: doc.title,
                streak: doc.streak || 0,
                completedDates: doc.completedDates || [],
                userId: doc.userId
            } as Habit)));

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setHasError(true);
            showError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
            setRetrying(false);
        }
    }, [user, showError]);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user, fetchDashboardData]);

    const handleRetry = () => {
        setRetrying(true);
        setLoading(true);
        fetchDashboardData();
    };

    const toggleTask = async (taskId: string, currentStatus: boolean) => {
        try {
            const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            await databases.updateDocument(dbId, 'tasks', taskId, {
                isCompleted: !currentStatus
            });
            setTasks(tasks.filter(t => t.$id !== taskId));
            success('Task completed! Great job! 🎉');
        } catch (err) {
            console.error('Error toggling task:', err);
            showError('Failed to update task. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="space-y-12 w-full">
                <section>
                    <Skeleton className="h-8 w-48 mb-6" />
                    <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded-2xl" />
                        <Skeleton className="h-16 w-full rounded-2xl" />
                        <Skeleton className="h-16 w-full rounded-2xl" />
                    </div>
                </section>
                <section>
                    <Skeleton className="h-8 w-48 mb-6" />
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                    </div>
                </section>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="w-full py-12">
                <EmptyState
                    icon={RefreshCw}
                    title="Failed to load dashboard"
                    description="We couldn't load your data. Please check your connection and try again."
                    action={
                        <Button onClick={handleRetry} loading={retrying}>
                            Try Again
                        </Button>
                    }
                />
            </div>
        );
    }

    // Dummy sparkline component for visual flair
    const Sparkline = () => (
        <div className="flex items-end gap-[2px] h-8 opacity-20 group-hover:opacity-40 transition-opacity">
            {[40, 60, 45, 70, 50, 80, 65, 90, 75, 100].map((h, i) => (
                <div key={i} className="w-1 bg-primary rounded-full" style={{ height: `${h}%` }} />
            ))}
        </div>
    );

    return (
        <div className="space-y-12 w-full">
            {/* Tasks Section */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        Today&apos;s Plan
                    </h2>
                </div>

                {tasks.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        title="All caught up!"
                        description="No tasks due today. Enjoy your free time."
                        className="bg-secondary/5"
                    />
                ) : (
                    <div className="grid gap-3">
                        <AnimatePresence mode='popLayout'>
                            {tasks.map((task) => (
                                <motion.div
                                    key={task.$id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    layout
                                >
                                    <div className="group flex items-center bg-white rounded-2xl border border-border/50 p-4 shadow-sm hover:shadow-md transition-all duration-200">
                                        <button
                                            onClick={() => toggleTask(task.$id, task.isCompleted)}
                                            className="mr-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer p-1 min-h-[44px] min-w-[44px] flex items-center justify-center -m-1"
                                            aria-label={`Mark "${task.title}" as complete`}
                                        >
                                            <Circle className="h-6 w-6 stroke-[1.5]" />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-foreground truncate text-base">{task.title}</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                                                {new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </section>

            {/* Habits Section */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-muted-foreground" />
                        Habit Streaks
                    </h2>
                </div>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {habits.map((habit, index) => (
                        <motion.div
                            key={habit.$id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="relative overflow-hidden p-6 h-full min-h-[140px] flex flex-col justify-between group hover:border-border transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-medium text-foreground truncate text-lg">{habit.title}</h3>
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                                        habit.streak > 0
                                            ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                                            : "bg-secondary text-muted-foreground"
                                    )}>
                                        <Flame className={cn("h-3.5 w-3.5", habit.streak > 0 && "fill-current")} />
                                        <span>{habit.streak}</span>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-end justify-between">
                                    <div className="text-xs text-muted-foreground font-medium">
                                        Current Streak
                                    </div>
                                    <Sparkline />
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                    {habits.length === 0 && (
                        <div className="col-span-full">
                            <EmptyState
                                icon={Flame}
                                title="No habits tracked yet"
                                description="Start building healthy habits to see your streaks here."
                                action={
                                    <Link href="/habits">
                                        <Button>Create Habit</Button>
                                    </Link>
                                }
                            />
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
