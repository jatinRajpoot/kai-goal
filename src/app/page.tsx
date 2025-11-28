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
import { CheckCircle2, Circle, Flame, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

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
                    Query.limit(20)
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
            <div className="space-y-8 max-w-5xl mx-auto w-full">
                <section>
                    <Skeleton className="h-8 w-48 mb-6" />
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full rounded-xl" />
                        <Skeleton className="h-20 w-full rounded-xl" />
                        <Skeleton className="h-20 w-full rounded-xl" />
                    </div>
                </section>
                <section>
                    <Skeleton className="h-8 w-48 mb-6" />
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                </section>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="max-w-5xl mx-auto w-full">
                <EmptyState
                    icon={RefreshCw}
                    title="Failed to load dashboard"
                    description="We couldn't load your data. Please check your connection and try again."
                    action={
                        <Button onClick={handleRetry} loading={retrying}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
                            Try Again
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-5xl mx-auto w-full">
            <section>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">Today&apos;s Plan</h2>
                    <span className="text-sm text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full font-medium">
                        {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                </div>

                {tasks.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        title="All caught up!"
                        description="No tasks due today. Enjoy your free time."
                        className="bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
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
                                    <Card className="flex items-center p-4 transition-all hover:bg-secondary/40 hover:shadow-md group border-border/60">
                                        <button
                                            onClick={() => toggleTask(task.$id, task.isCompleted)}
                                            className="mr-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer p-1 min-h-[44px] min-w-[44px] flex items-center justify-center -m-1"
                                            aria-label={`Mark "${task.title}" as complete`}
                                        >
                                            <Circle className="h-5 w-5" />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-foreground truncate">{task.title}</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </section>

            <section>
                <h2 className="mb-6 text-xl font-semibold tracking-tight text-foreground">Habit Streaks</h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {habits.map((habit, index) => (
                        <motion.div
                            key={habit.$id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="flex items-center justify-between p-5 hover:border-primary/20 hover:shadow-md transition-all">
                                <span className="font-medium text-foreground truncate mr-2">{habit.title}</span>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 rounded-full text-orange-600 dark:text-orange-400 flex-shrink-0">
                                    <Flame className="h-3.5 w-3.5 fill-current" />
                                    <span className="font-bold text-xs">{habit.streak}</span>
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
                            />
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
