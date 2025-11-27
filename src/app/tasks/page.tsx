'use client';

import React, { useState, useEffect } from 'react';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { Task } from '@/types';
import { Circle, CheckCircle2 } from 'lucide-react';

export default function TasksPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    useEffect(() => {
        if (user) {
            fetchTasks();
        }
    }, [user, filter]);

    const fetchTasks = async () => {
        try {
            const queries = [
                Query.equal('userId', user!.$id),
                Query.orderAsc('dueDate'),
            ];

            if (filter === 'active') {
                queries.push(Query.equal('isCompleted', false));
            } else if (filter === 'completed') {
                queries.push(Query.equal('isCompleted', true));
            }

            const response = await databases.listDocuments(dbId, 'tasks', queries);
            setTasks(response.documents as unknown as Task[]);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTask = async (taskId: string, currentStatus: boolean) => {
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
        } catch (error) {
            console.error('Error toggling task:', error);
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h2>
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl dark:bg-gray-800">
                    {(['active', 'completed', 'all'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${filter === f
                                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {tasks.map(task => (
                    <Card key={task.$id} className="flex items-center p-4 hover:shadow-lg transition-all group">
                        <button
                            onClick={() => toggleTask(task.$id, task.isCompleted)}
                            className={`mr-4 cursor-pointer transition-colors ${task.isCompleted ? 'text-green-500' : 'text-muted-foreground hover:text-green-500'}`}
                        >
                            {task.isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                        </button>
                        <div className="flex-1">
                            <h3 className={`font-medium ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground group-hover:text-primary'} transition-colors`}>{task.title}</h3>
                            <p className="text-sm text-muted-foreground">
                                Due: {new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </Card>
                ))}
                {tasks.length === 0 && (
                    <Card className="flex flex-col items-center justify-center py-12">
                        <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-lg">No tasks found.</p>
                        <p className="text-muted-foreground/70 text-sm">Start adding tasks from Inbox!</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
