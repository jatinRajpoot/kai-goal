'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { databases } from '@/lib/appwrite';
import { ID, Query, Permission, Role } from 'appwrite';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { InboxItem, Goal, Phase } from '@/types';
import { ArrowRight, Check, Trash2, Inbox, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InboxPage() {
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const [items, setItems] = useState<InboxItem[]>([]);
    const [newItem, setNewItem] = useState('');
    const [convertToTask, setConvertToTask] = useState(false);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [selectedGoal, setSelectedGoal] = useState('');
    const [phases, setPhases] = useState<Phase[]>([]);
    const [selectedPhase, setSelectedPhase] = useState('');
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    const fetchInbox = useCallback(async () => {
        if (!user) return;
        try {
            setHasError(false);
            const response = await databases.listDocuments(dbId, 'inbox', [
                Query.equal('userId', user.$id),
                Query.equal('isProcessed', false),
                Query.orderDesc('$createdAt'),
            ]);
            setItems(response.documents as unknown as InboxItem[]);
        } catch (err) {
            console.error('Error fetching inbox:', err);
            setHasError(true);
            showError('Failed to load inbox. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user, dbId, showError]);

    const fetchGoals = useCallback(async () => {
        if (!user) return;
        try {
            const response = await databases.listDocuments(dbId, 'goals', [
                Query.equal('userId', user.$id),
            ]);
            setGoals(response.documents as unknown as Goal[]);
        } catch (err) {
            console.error('Error fetching goals:', err);
        }
    }, [user, dbId]);

    useEffect(() => {
        if (user) {
            fetchInbox();
            fetchGoals();
        }
    }, [user, fetchInbox, fetchGoals]);

    useEffect(() => {
        const fetchPhases = async (goalId: string) => {
            try {
                const response = await databases.listDocuments(dbId, 'phases', [
                    Query.equal('goalId', goalId),
                    Query.orderAsc('order'),
                ]);
                setPhases(response.documents as unknown as Phase[]);
            } catch (err) {
                console.error('Error fetching phases:', err);
            }
        };

        if (selectedGoal) {
            fetchPhases(selectedGoal);
        } else {
            setPhases([]);
            setSelectedPhase('');
        }
    }, [selectedGoal, dbId]);

    const handleCapture = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        setIsSubmitting(true);
        try {
            if (convertToTask) {
                // Create Task directly
                await databases.createDocument(dbId, 'tasks', ID.unique(), {
                    title: newItem,
                    isCompleted: false,
                    dueDate: new Date().toISOString(),
                    goalId: selectedGoal || undefined,
                    phaseId: selectedPhase || undefined,
                    userId: user!.$id,
                }, [
                    Permission.read(Role.user(user!.$id)),
                    Permission.update(Role.user(user!.$id)),
                    Permission.delete(Role.user(user!.$id)),
                ]);
                success('Task created successfully! ✨');
            } else {
                // Create Inbox Item
                const response = await databases.createDocument(dbId, 'inbox', ID.unique(), {
                    content: newItem,
                    userId: user!.$id,
                    isProcessed: false,
                }, [
                    Permission.read(Role.user(user!.$id)),
                    Permission.update(Role.user(user!.$id)),
                    Permission.delete(Role.user(user!.$id)),
                ]);
                setItems([response as unknown as InboxItem, ...items]);
                success('Saved to inbox!');
            }
            setNewItem('');
            setConvertToTask(false);
            setSelectedGoal('');
            setSelectedPhase('');
        } catch (err) {
            console.error('Error capturing item:', err);
            showError('Failed to save. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const markProcessed = async (id: string) => {
        try {
            await databases.updateDocument(dbId, 'inbox', id, {
                isProcessed: true,
            });
            setItems(items.filter(item => item.$id !== id));
            success('Item processed!');
        } catch (err) {
            console.error('Error processing item:', err);
            showError('Failed to process item. Please try again.');
        }
    };

    if (loading) {
        return <PageLoader text="Loading inbox..." />;
    }

    if (hasError) {
        return (
            <div className="max-w-2xl mx-auto w-full">
                <EmptyState
                    icon={RefreshCw}
                    title="Failed to load inbox"
                    description="We couldn't load your inbox. Please check your connection and try again."
                    action={
                        <Button onClick={fetchInbox}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto w-full space-y-8">
            <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">Quick Capture</h2>
                <Card className="p-4 sm:p-6">
                    <form onSubmit={handleCapture} className="space-y-4">
                        <Input
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            placeholder="What's on your mind?"
                            className="text-lg"
                        />

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="convertToTask"
                                checked={convertToTask}
                                onChange={(e) => setConvertToTask(e.target.checked)}
                                className="rounded border-border text-primary focus:ring-primary cursor-pointer h-5 w-5"
                            />
                            <label htmlFor="convertToTask" className="text-sm font-medium text-muted-foreground cursor-pointer">
                                Convert to Task immediately
                            </label>
                        </div>

                        {convertToTask && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <select
                                    value={selectedGoal}
                                    onChange={(e) => setSelectedGoal(e.target.value)}
                                    className="w-full rounded-xl border border-input bg-background text-foreground p-3 text-sm cursor-pointer focus:ring-2 focus:ring-ring focus:border-input transition-all min-h-[44px]"
                                >
                                    <option value="">Select Goal (Optional)</option>
                                    {goals.map(g => (
                                        <option key={g.$id} value={g.$id}>{g.title}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedPhase}
                                    onChange={(e) => setSelectedPhase(e.target.value)}
                                    disabled={!selectedGoal}
                                    className="w-full rounded-xl border border-input bg-background text-foreground p-3 text-sm cursor-pointer focus:ring-2 focus:ring-ring focus:border-input transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                                >
                                    <option value="">Select Phase (Optional)</option>
                                    {phases.map(p => (
                                        <option key={p.$id} value={p.$id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit" loading={isSubmitting}>
                                {convertToTask ? 'Create Task' : 'Save to Inbox'}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </form>
                </Card>
            </section>

            <section>
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                    Inbox <span className="text-muted-foreground font-normal">({items.length})</span>
                </h3>
                <div className="space-y-3">
                    {items.map(item => (
                        <Card key={item.$id} className="p-4 flex items-center justify-between group hover:shadow-md transition-all">
                            <span className="text-foreground flex-1 mr-4">{item.content}</span>
                            <div className="flex space-x-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => markProcessed(item.$id)}
                                    className="min-h-[44px] min-w-[44px]"
                                    aria-label="Mark as processed"
                                >
                                    <Check className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => markProcessed(item.$id)}
                                    className="min-h-[44px] min-w-[44px]"
                                    aria-label="Delete item"
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                    {items.length === 0 && (
                        <EmptyState
                            icon={Inbox}
                            title="Inbox is empty"
                            description="All caught up! Capture new thoughts above. ✨"
                            className="bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                        />
                    )}
                </div>
            </section>
        </div>
    );
}
