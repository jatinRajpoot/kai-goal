'use client';

import React, { useState, useEffect } from 'react';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { Goal, Phase, Task } from '@/types';
import { ChevronDown, ChevronRight, Plus, X, Check, Circle, Trash2, Calendar } from 'lucide-react';

import { Input } from '@/components/ui/Input';
import { ID, Permission, Role } from 'appwrite';
import { cn } from '@/lib/utils';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

export default function GoalsPage() {
    const { user } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
    const [phases, setPhases] = useState<Record<string, Phase[]>>({});
    const [tasks, setTasks] = useState<Record<string, Task[]>>({});
    const [loading, setLoading] = useState(true);

    // Goal creation
    const [isAddingGoal, setIsAddingGoal] = useState(false);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalDeadline, setNewGoalDeadline] = useState('');

    // Phase creation
    const [addingPhaseForGoal, setAddingPhaseForGoal] = useState<string | null>(null);
    const [newPhaseTitle, setNewPhaseTitle] = useState('');

    // Task creation
    const [addingTaskForPhase, setAddingTaskForPhase] = useState<string | null>(null);
    const [addingTaskForGoal, setAddingTaskForGoal] = useState<string | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState(getTodayDate());

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    useEffect(() => {
        if (user) {
            fetchGoals();
        }
    }, [user]);

    const fetchGoals = async () => {
        try {
            const response = await databases.listDocuments(dbId, 'goals', [
                Query.equal('userId', user!.$id),
                Query.orderDesc('$createdAt'),
            ]);
            setGoals(response.documents as unknown as Goal[]);
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGoalDetails = async (goalId: string) => {
        try {
            // Fetch Phases
            const phasesRes = await databases.listDocuments(dbId, 'phases', [
                Query.equal('goalId', goalId),
                Query.orderAsc('order'),
            ]);
            const goalPhases = phasesRes.documents as unknown as Phase[];
            setPhases(prev => ({ ...prev, [goalId]: goalPhases }));

            // Fetch Tasks for this goal
            const tasksRes = await databases.listDocuments(dbId, 'tasks', [
                Query.equal('goalId', goalId),
                Query.orderAsc('$createdAt'),
            ]);
            const goalTasks = tasksRes.documents as unknown as Task[];
            setTasks(prev => ({ ...prev, [goalId]: goalTasks }));

        } catch (error) {
            console.error('Error fetching goal details:', error);
        }
    };

    const toggleGoal = (goalId: string) => {
        if (expandedGoal === goalId) {
            setExpandedGoal(null);
        } else {
            setExpandedGoal(goalId);
            fetchGoalDetails(goalId);
        }
    };

    const addGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoalTitle.trim()) return;

        try {
            const response = await databases.createDocument(dbId, 'goals', ID.unique(), {
                title: newGoalTitle,
                userId: user!.$id,
                deadline: newGoalDeadline || null,
            }, [
                Permission.read(Role.user(user!.$id)),
                Permission.update(Role.user(user!.$id)),
                Permission.delete(Role.user(user!.$id)),
            ]);

            setGoals([response as unknown as Goal, ...goals]);
            setNewGoalTitle('');
            setNewGoalDeadline('');
            setIsAddingGoal(false);
        } catch (error) {
            console.error('Error adding goal:', error);
        }
    };

    const deleteGoal = async (goalId: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Goal',
            message: 'Are you sure you want to delete this goal? All phases and tasks associated with it will also be deleted. This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await databases.deleteDocument(dbId, 'goals', goalId);
                    setGoals(goals.filter(g => g.$id !== goalId));
                    if (expandedGoal === goalId) setExpandedGoal(null);
                } catch (error) {
                    console.error('Error deleting goal:', error);
                }
            },
        });
    };

    const addPhase = async (e: React.FormEvent, goalId: string) => {
        e.preventDefault();
        if (!newPhaseTitle.trim()) return;

        try {
            const currentPhases = phases[goalId] || [];
            const response = await databases.createDocument(dbId, 'phases', ID.unique(), {
                title: newPhaseTitle,
                goalId: goalId,
                order: currentPhases.length + 1,
            }, [
                Permission.read(Role.user(user!.$id)),
                Permission.update(Role.user(user!.$id)),
                Permission.delete(Role.user(user!.$id)),
            ]);

            setPhases(prev => ({
                ...prev,
                [goalId]: [...(prev[goalId] || []), response as unknown as Phase]
            }));
            setNewPhaseTitle('');
            setAddingPhaseForGoal(null);
        } catch (error) {
            console.error('Error adding phase:', error);
        }
    };

    const deletePhase = async (phaseId: string, goalId: string, phaseTitle: string) => {
        const phaseTasks = getTasksForPhase(goalId, phaseId);
        const taskCount = phaseTasks.length;

        setConfirmDialog({
            isOpen: true,
            title: 'Delete Phase',
            message: taskCount > 0
                ? `Are you sure you want to delete "${phaseTitle}"? This phase has ${taskCount} task${taskCount > 1 ? 's' : ''} that will also be deleted.`
                : `Are you sure you want to delete "${phaseTitle}"? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    await databases.deleteDocument(dbId, 'phases', phaseId);
                    setPhases(prev => ({
                        ...prev,
                        [goalId]: (prev[goalId] || []).filter(p => p.$id !== phaseId)
                    }));
                    // Also remove tasks associated with this phase from state
                    setTasks(prev => ({
                        ...prev,
                        [goalId]: (prev[goalId] || []).filter(t => t.phaseId !== phaseId)
                    }));
                } catch (error) {
                    console.error('Error deleting phase:', error);
                }
            },
        });
    };

    const addTask = async (e: React.FormEvent, goalId: string, phaseId?: string) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        try {
            const response = await databases.createDocument(dbId, 'tasks', ID.unique(), {
                title: newTaskTitle,
                userId: user!.$id,
                goalId: goalId,
                phaseId: phaseId || null,
                isCompleted: false,
                dueDate: newTaskDueDate || new Date().toISOString(),
            }, [
                Permission.read(Role.user(user!.$id)),
                Permission.update(Role.user(user!.$id)),
                Permission.delete(Role.user(user!.$id)),
            ]);

            setTasks(prev => ({
                ...prev,
                [goalId]: [...(prev[goalId] || []), response as unknown as Task]
            }));
            setNewTaskTitle('');
            setNewTaskDueDate('');
            setAddingTaskForPhase(null);
            setAddingTaskForGoal(null);
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    const toggleTask = async (task: Task, goalId: string) => {
        try {
            await databases.updateDocument(dbId, 'tasks', task.$id, {
                isCompleted: !task.isCompleted
            });
            setTasks(prev => ({
                ...prev,
                [goalId]: (prev[goalId] || []).map(t =>
                    t.$id === task.$id ? { ...t, isCompleted: !t.isCompleted } : t
                )
            }));
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    };

    const deleteTask = async (taskId: string, goalId: string) => {
        try {
            await databases.deleteDocument(dbId, 'tasks', taskId);
            setTasks(prev => ({
                ...prev,
                [goalId]: (prev[goalId] || []).filter(t => t.$id !== taskId)
            }));
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const getTasksForPhase = (goalId: string, phaseId: string) => {
        return (tasks[goalId] || []).filter(t => t.phaseId === phaseId);
    };

    const getUnassignedTasks = (goalId: string) => {
        return (tasks[goalId] || []).filter(t => !t.phaseId);
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
                <h2 className="text-2xl font-bold text-foreground">Goals</h2>
                <Button onClick={() => setIsAddingGoal(!isAddingGoal)}>
                    {isAddingGoal ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {isAddingGoal ? 'Cancel' : 'New Goal'}
                </Button>
            </div>

            {isAddingGoal && (
                <Card className="p-5 animate-in fade-in slide-in-from-top-2">
                    <form onSubmit={addGoal} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Goal Title</label>
                            <Input
                                value={newGoalTitle}
                                onChange={(e) => setNewGoalTitle(e.target.value)}
                                placeholder="e.g., Learn Spanish, Get Fit, Launch Product"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Deadline (optional)</label>
                            <Input
                                type="date"
                                value={newGoalDeadline}
                                onChange={(e) => setNewGoalDeadline(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsAddingGoal(false)}>Cancel</Button>
                            <Button type="submit">Create Goal</Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="space-y-4">
                {goals.map(goal => (
                    <Card key={goal.$id} className="overflow-hidden p-0 hover:shadow-lg transition-all">
                        <div
                            className="flex cursor-pointer items-center justify-between p-5 hover:bg-accent/50 transition-colors"
                            onClick={() => toggleGoal(goal.$id)}
                        >
                            <div className="flex items-center flex-1">
                                {expandedGoal === goal.$id ? (
                                    <ChevronDown className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="mr-3 h-5 w-5 text-muted-foreground flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                    <h3 className="font-semibold text-foreground">{goal.title}</h3>
                                    {goal.deadline && (
                                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                                            <Calendar className="h-3.5 w-3.5 mr-1" />
                                            {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteGoal(goal.$id); }}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>

                        {expandedGoal === goal.$id && (
                            <div className="border-t border-border bg-muted/30 p-5 space-y-6">
                                {/* Phases Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-foreground">Phases</h4>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setAddingPhaseForGoal(addingPhaseForGoal === goal.$id ? null : goal.$id)}
                                        >
                                            {addingPhaseForGoal === goal.$id ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        </Button>
                                    </div>

                                    {addingPhaseForGoal === goal.$id && (
                                        <form onSubmit={(e) => addPhase(e, goal.$id)} className="mb-4 flex gap-2">
                                            <Input
                                                value={newPhaseTitle}
                                                onChange={(e) => setNewPhaseTitle(e.target.value)}
                                                placeholder="Phase name (e.g., Research, Planning, Execution)"
                                                autoFocus
                                                className="flex-1"
                                            />
                                            <Button type="submit" size="sm">Add</Button>
                                        </form>
                                    )}

                                    {(phases[goal.$id] || []).length > 0 ? (
                                        <div className="space-y-3">
                                            {(phases[goal.$id] || []).map((phase, index) => {
                                                const phaseTasks = getTasksForPhase(goal.$id, phase.$id);
                                                const completedCount = phaseTasks.filter(t => t.isCompleted).length;

                                                return (
                                                    <div key={phase.$id} className="rounded-xl border border-border bg-card/50 p-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                                                    {index + 1}
                                                                </span>
                                                                <h5 className="font-medium text-foreground">{phase.title}</h5>
                                                                {phaseTasks.length > 0 && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        ({completedCount}/{phaseTasks.length})
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => {
                                                                        if (addingTaskForPhase !== phase.$id) {
                                                                            setNewTaskDueDate(getTodayDate());
                                                                        }
                                                                        setAddingTaskForPhase(addingTaskForPhase === phase.$id ? null : phase.$id);
                                                                    }}
                                                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => deletePhase(phase.$id, goal.$id, phase.title)}
                                                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {addingTaskForPhase === phase.$id && (
                                                            <form onSubmit={(e) => addTask(e, goal.$id, phase.$id)} className="mb-3 flex gap-2">
                                                                <Input
                                                                    value={newTaskTitle}
                                                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                                                    placeholder="Task title"
                                                                    autoFocus
                                                                    className="flex-1"
                                                                />
                                                                <Input
                                                                    type="date"
                                                                    value={newTaskDueDate}
                                                                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                                                                    className="w-40"
                                                                />
                                                                <Button type="submit" size="sm">Add</Button>
                                                            </form>
                                                        )}

                                                        {phaseTasks.length > 0 ? (
                                                            <ul className="space-y-2">
                                                                {phaseTasks.map(task => (
                                                                    <li key={task.$id} className="flex items-center group">
                                                                        <button
                                                                            onClick={() => toggleTask(task, goal.$id)}
                                                                            className={cn(
                                                                                "mr-3 h-5 w-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors",
                                                                                task.isCompleted
                                                                                    ? 'bg-primary border-primary text-primary-foreground'
                                                                                    : 'border-muted-foreground/30 hover:border-primary'
                                                                            )}
                                                                        >
                                                                            {task.isCompleted && <Check className="h-3 w-3" />}
                                                                        </button>
                                                                        <span className={cn(
                                                                            "flex-1 text-sm",
                                                                            task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                                                                        )}>
                                                                            {task.title}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => deleteTask(task.$id, goal.$id)}
                                                                            className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground italic">No tasks yet</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
                                            No phases defined. Add phases to break down your goal into manageable steps.
                                        </p>
                                    )}
                                </div>

                                {/* Unassigned Tasks Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-foreground">Quick Tasks</h4>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                if (addingTaskForGoal !== goal.$id) {
                                                    setNewTaskDueDate(getTodayDate());
                                                }
                                                setAddingTaskForGoal(addingTaskForGoal === goal.$id ? null : goal.$id);
                                            }}
                                        >
                                            {addingTaskForGoal === goal.$id ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        </Button>
                                    </div>

                                    {addingTaskForGoal === goal.$id && (
                                        <form onSubmit={(e) => addTask(e, goal.$id)} className="mb-3 flex gap-2">
                                            <Input
                                                value={newTaskTitle}
                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                placeholder="Task title"
                                                autoFocus
                                                className="flex-1"
                                            />
                                            <Input
                                                type="date"
                                                value={newTaskDueDate}
                                                onChange={(e) => setNewTaskDueDate(e.target.value)}
                                                className="w-40"
                                            />
                                            <Button type="submit" size="sm">Add</Button>
                                        </form>
                                    )}

                                    {getUnassignedTasks(goal.$id).length > 0 ? (
                                        <ul className="space-y-2 bg-secondary/20 rounded-xl border border-border p-4">
                                            {getUnassignedTasks(goal.$id).map(task => (
                                                <li key={task.$id} className="flex items-center group">
                                                    <button
                                                        onClick={() => toggleTask(task, goal.$id)}
                                                        className={cn(
                                                            "mr-3 h-5 w-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors",
                                                            task.isCompleted
                                                                ? 'bg-primary border-primary text-primary-foreground'
                                                                : 'border-muted-foreground/30 hover:border-primary'
                                                        )}
                                                    >
                                                        {task.isCompleted && <Check className="h-3 w-3" />}
                                                    </button>
                                                    <span className={cn(
                                                        "flex-1 text-sm",
                                                        task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                                                    )}>
                                                        {task.title}
                                                    </span>
                                                    <button
                                                        onClick={() => deleteTask(task.$id, goal.$id)}
                                                        className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
                                            Add quick tasks that don't belong to a specific phase.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
                {goals.length === 0 && !isAddingGoal && (
                    <Card className="flex flex-col items-center justify-center py-12">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                            <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-muted-foreground text-lg">No goals yet.</p>
                        <p className="text-muted-foreground/70 text-sm">Create your first goal to get started!</p>
                    </Card>
                )}
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
