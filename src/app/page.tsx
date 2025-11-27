'use client';

import React, { useEffect, useState } from 'react';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Task, Habit } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, Circle, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

            const tasksResponse = await databases.listDocuments(
                dbId,
                'tasks',
                [
                    Query.equal('userId', user!.$id),
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
                    Query.equal('userId', user!.$id),
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

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTask = async (taskId: string, currentStatus: boolean) => {
        try {
            const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            await databases.updateDocument(dbId, 'tasks', taskId, {
                isCompleted: !currentStatus
            });
            setTasks(tasks.filter(t => t.$id !== taskId));
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 max-w-5xl mx-auto p-6">
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
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-5xl mx-auto p-6">
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">Today&apos;s Plan</h2>
                    <span className="text-sm text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full font-medium">
                        {tasks.length}
                    </span>
                </div>

                {tasks.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-secondary/20"
                    >
                        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="text-foreground font-medium">All caught up!</p>
                        <p className="text-muted-foreground text-sm mt-1">No tasks due today. Enjoy your free time.</p>
                    </motion.div>
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
                                    <Card className="flex items-center p-4 transition-all hover:bg-secondary/40 group border-border/60">
                                        <button
                                            onClick={() => toggleTask(task.$id, task.isCompleted)}
                                            className="mr-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {habits.map((habit, index) => (
                        <motion.div
                            key={habit.$id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="flex items-center justify-between p-5 hover:border-primary/20 transition-colors">
                                <span className="font-medium text-foreground">{habit.title}</span>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 rounded-full text-orange-600 dark:text-orange-400">
                                    <Flame className="h-3.5 w-3.5 fill-current" />
                                    <span className="font-bold text-xs">{habit.streak}</span>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                    {habits.length === 0 && (
                        <Card className="col-span-full flex flex-col items-center justify-center py-12 border-dashed bg-secondary/20">
                            <Flame className="h-10 w-10 text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground text-sm">No habits tracked yet.</p>
                        </Card>
                    )}
                </div>
            </section>
        </div>
    );
}
