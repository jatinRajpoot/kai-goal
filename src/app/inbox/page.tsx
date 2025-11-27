'use client';

import React, { useState, useEffect } from 'react';
import { databases } from '@/lib/appwrite';
import { ID, Query, Permission, Role } from 'appwrite';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { InboxItem, Goal, Phase } from '@/types';
import { ArrowRight, Check, Trash2 } from 'lucide-react';

export default function InboxPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<InboxItem[]>([]);
    const [newItem, setNewItem] = useState('');
    const [convertToTask, setConvertToTask] = useState(false);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [selectedGoal, setSelectedGoal] = useState('');
    const [phases, setPhases] = useState<Phase[]>([]);
    const [selectedPhase, setSelectedPhase] = useState('');
    const [loading, setLoading] = useState(true);

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    useEffect(() => {
        if (user) {
            fetchInbox();
            fetchGoals();
        }
    }, [user]);

    useEffect(() => {
        if (selectedGoal) {
            fetchPhases(selectedGoal);
        } else {
            setPhases([]);
            setSelectedPhase('');
        }
    }, [selectedGoal]);

    const fetchInbox = async () => {
        try {
            const response = await databases.listDocuments(dbId, 'inbox', [
                Query.equal('userId', user!.$id),
                Query.equal('isProcessed', false),
                Query.orderDesc('$createdAt'),
            ]);
            setItems(response.documents as unknown as InboxItem[]);
        } catch (error) {
            console.error('Error fetching inbox:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGoals = async () => {
        try {
            const response = await databases.listDocuments(dbId, 'goals', [
                Query.equal('userId', user!.$id),
            ]);
            setGoals(response.documents as unknown as Goal[]);
        } catch (error) {
            console.error('Error fetching goals:', error);
        }
    };

    const fetchPhases = async (goalId: string) => {
        try {
            const response = await databases.listDocuments(dbId, 'phases', [
                Query.equal('goalId', goalId),
                Query.orderAsc('order'),
            ]);
            setPhases(response.documents as unknown as Phase[]);
        } catch (error) {
            console.error('Error fetching phases:', error);
        }
    };

    const handleCapture = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        try {
            if (convertToTask) {
                // Create Task directly
                await databases.createDocument(dbId, 'tasks', ID.unique(), {
                    title: newItem,
                    isCompleted: false,
                    dueDate: new Date().toISOString(), // Default to today? Or null if allowed. Schema said required.
                    goalId: selectedGoal || undefined,
                    phaseId: selectedPhase || undefined,
                    userId: user!.$id,
                }, [
                    Permission.read(Role.user(user!.$id)),
                    Permission.update(Role.user(user!.$id)),
                    Permission.delete(Role.user(user!.$id)),
                ]);
                alert('Task created!');
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
            }
            setNewItem('');
            setConvertToTask(false);
            setSelectedGoal('');
            setSelectedPhase('');
        } catch (error) {
            console.error('Error capturing item:', error);
        }
    };

    const markProcessed = async (id: string) => {
        try {
            await databases.updateDocument(dbId, 'inbox', id, {
                isProcessed: true,
            });
            setItems(items.filter(item => item.$id !== id));
        } catch (error) {
            console.error('Error processing item:', error);
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
        <div className="max-w-2xl mx-auto space-y-8">
            <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">Quick Capture</h2>
                <Card className="p-6">
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
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                            />
                            <label htmlFor="convertToTask" className="text-sm font-medium text-muted-foreground cursor-pointer">
                                Convert to Task immediately
                            </label>
                        </div>

                        {convertToTask && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <select
                                    value={selectedGoal}
                                    onChange={(e) => setSelectedGoal(e.target.value)}
                                    className="w-full rounded-xl border border-input bg-background text-foreground p-3 text-sm cursor-pointer focus:ring-2 focus:ring-ring focus:border-input transition-all"
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
                                    className="w-full rounded-xl border border-input bg-background text-foreground p-3 text-sm cursor-pointer focus:ring-2 focus:ring-ring focus:border-input transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">Select Phase (Optional)</option>
                                    {phases.map(p => (
                                        <option key={p.$id} value={p.$id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit">
                                {convertToTask ? 'Create Task' : 'Save to Inbox'}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </form>
                </Card>
            </section>

            <section>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Inbox ({items.length})</h3>
                <div className="space-y-3">
                    {items.map(item => (
                        <Card key={item.$id} className="p-4 flex items-center justify-between group hover:shadow-lg transition-all">
                            <span className="text-foreground">{item.content}</span>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="ghost" onClick={() => markProcessed(item.$id)}>
                                    <Check className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => markProcessed(item.$id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                    {items.length === 0 && (
                        <Card className="flex flex-col items-center justify-center py-12">
                            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                                <Check className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-muted-foreground text-lg">Inbox is empty.</p>
                            <p className="text-muted-foreground/70 text-sm">All caught up! ✨</p>
                        </Card>
                    )}
                </div>
            </section>
        </div>
    );
}
