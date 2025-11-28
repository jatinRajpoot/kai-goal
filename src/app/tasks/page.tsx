'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Task } from '@/types';
import { Circle, CheckCircle2, RefreshCw, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TasksPage() {
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

    const fetchTasks = useCallback(async () => {
        if (!dbId || !user) return;
        try {
            setHasError(false);
            const queries = [
                Query.equal('userId', user.$id),
                Query.orderAsc('dueDate'),
            ];

            if (filter === 'active') {
                queries.push(Query.equal('isCompleted', false));
            } else if (filter === 'completed') {
                queries.push(Query.equal('isCompleted', true));
            }

            const response = await databases.listDocuments(dbId, 'tasks', queries);
            setTasks(response.documents as unknown as Task[]);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setHasError(true);
            showError('Failed to load tasks. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [dbId, user, filter, showError]);

    useEffect(() => {
        if (user && dbId) {
            fetchTasks();
        } else if (!dbId) {
            console.error('Missing Database ID');
            setLoading(false);
        }
    }, [user, filter, dbId, fetchTasks]);

    const toggleTask = async (taskId: string, currentStatus: boolean) => {
        if (!dbId) return;
        try {
            await databases.updateDocument(dbId, 'tasks', taskId, {
                isCompleted: !currentStatus
            });
            // Refresh or optimistic update
            if (filter !== 'all') {
                setTasks(tasks.filter(t => t.$id !== taskId));
            } else {
                setTasks(tasks.map(t => t.$id === taskId ? { ...t, isCompleted: !currentStatus } : t));
            }
            if (!currentStatus) {
                success('Task completed! Great work! 🎉');
            }
        } catch (err) {
            console.error('Error toggling task:', err);
            showError('Failed to update task. Please try again.');
        }
    };

    if (loading) {
        return <PageLoader text="Loading tasks..." />;
    }

    if (hasError) {
        return (
            <div className="max-w-4xl mx-auto w-full">
                <EmptyState
                    icon={RefreshCw}
                    title="Failed to load tasks"
                    description="We couldn't load your tasks. Please check your connection and try again."
                    action={
                        <Button onClick={fetchTasks}>
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
                <h2 className="text-2xl font-bold text-foreground">Tasks</h2>
                <div className="flex space-x-1 bg-secondary p-1 rounded-xl w-full sm:w-auto">
                    {(['active', 'completed', 'all'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                'flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer min-h-[44px]',
                                filter === f
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {tasks.map(task => (
                    <Card key={task.$id} className="flex items-center p-4 hover:shadow-md transition-all group">
                        <button
                            onClick={() => toggleTask(task.$id, task.isCompleted)}
                            className={cn(
                                'mr-4 cursor-pointer transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center -m-1',
                                task.isCompleted ? 'text-green-500' : 'text-muted-foreground hover:text-green-500'
                            )}
                            aria-label={task.isCompleted ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
                        >
                            {task.isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                        </button>
                        <div className="flex-1 min-w-0">
                            <h3 className={cn(
                                'font-medium truncate',
                                task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground group-hover:text-primary'
                            )}>
                                {task.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Due: {new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </Card>
                ))}
                {tasks.length === 0 && (
                    <EmptyState
                        icon={filter === 'completed' ? CheckCircle2 : ListTodo}
                        title={filter === 'completed' ? 'No completed tasks' : 'No tasks found'}
                        description={
                            filter === 'completed' 
                                ? 'Complete some tasks and they will appear here.' 
                                : filter === 'active' 
                                    ? 'All caught up! No active tasks to show.' 
                                    : 'Start adding tasks from the Inbox!'
                        }
                    />
                )}
            </div>
        </div>
    );
}
