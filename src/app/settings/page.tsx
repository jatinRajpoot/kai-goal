'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { account, databases } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ID, Query, Permission, Role } from 'appwrite';
import { Trash2, Key, Copy, Check, RefreshCw, User } from 'lucide-react';

interface ApiKey {
    $id: string;
    key: string;
    createdAt: string;
    userId: string;
}

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const { success, error: showError } = useToast();
    const [name, setName] = useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [isLoadingKeys, setIsLoadingKeys] = useState(true);
    const [isGeneratingKey, setIsGeneratingKey] = useState(false);
    const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        keyId: string | null;
    }>({
        isOpen: false,
        keyId: null,
    });

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

    const fetchApiKeys = useCallback(async () => {
        if (!user || !dbId) return;
        setIsLoadingKeys(true);
        try {
            const response = await databases.listDocuments(
                dbId,
                'api_keys',
                [Query.equal('userId', user.$id)]
            );
            setApiKeys(response.documents as unknown as ApiKey[]);
        } catch (err) {
            console.error('Error fetching API keys:', err);
            showError('Failed to load API keys.');
        } finally {
            setIsLoadingKeys(false);
        }
    }, [user, dbId, showError]);

    useEffect(() => {
        if (user) {
            setName(user.name);
            fetchApiKeys();
        }
    }, [user, fetchApiKeys]);

    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsUpdatingProfile(true);
        try {
            await account.updateName(name);
            await refreshUser();
            success('Profile updated successfully!');
        } catch (err) {
            console.error('Error updating profile:', err);
            showError('Failed to update profile. Please try again.');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const generateApiKey = async () => {
        if (!user || !dbId) return;

        setIsGeneratingKey(true);
        setNewlyGeneratedKey(null);

        try {
            // Generate a random key
            const rawKey = 'pk_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            const doc = await databases.createDocument(
                dbId,
                'api_keys',
                ID.unique(),
                {
                    userId: user.$id,
                    key: rawKey,
                    createdAt: new Date().toISOString()
                },
                [
                    Permission.read(Role.user(user.$id)),
                    Permission.delete(Role.user(user.$id)),
                ]
            );

            setNewlyGeneratedKey(rawKey);
            setApiKeys(prev => [...prev, doc as unknown as ApiKey]);
            success('API key generated successfully!');
        } catch (err) {
            console.error('Error generating API key:', err);
            showError('Failed to generate API key. Please try again.');
        } finally {
            setIsGeneratingKey(false);
        }
    };

    const deleteApiKey = async (id: string) => {
        if (!dbId) return;

        try {
            await databases.deleteDocument(dbId, 'api_keys', id);
            setApiKeys(prev => prev.filter(k => k.$id !== id));
            success('API key deleted successfully.');
        } catch (err) {
            console.error('Error deleting API key:', err);
            showError('Failed to delete API key. Please try again.');
        }
    };

    const handleDeleteClick = (keyId: string) => {
        setConfirmDialog({
            isOpen: true,
            keyId,
        });
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        success('Copied to clipboard!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (!user) {
        return <PageLoader text="Loading settings..." />;
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto w-full">
            <div>
                <h2 className="text-2xl font-bold text-foreground">Settings</h2>
                <p className="text-muted-foreground mt-1">Manage your account and developer settings.</p>
            </div>

            {/* Profile Section */}
            <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Profile</h3>
                </div>

                <form onSubmit={updateProfile} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium mb-1">Display Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your Name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <Input
                            value={user?.email || ''}
                            disabled
                            className="bg-muted text-muted-foreground"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
                    </div>
                    <Button type="submit" disabled={isUpdatingProfile || name === user?.name} loading={isUpdatingProfile}>
                        Update Profile
                    </Button>
                </form>
            </Card>

            {/* API Keys Section */}
            <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        <div>
                            <h3 className="font-semibold text-lg">API Keys</h3>
                            <p className="text-sm text-muted-foreground">Manage keys for accessing your data via the Custom GPT API.</p>
                        </div>
                    </div>
                    <Button onClick={generateApiKey} disabled={isGeneratingKey} loading={isGeneratingKey}>
                        Generate New Key
                    </Button>
                </div>

                {newlyGeneratedKey && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-green-900 dark:text-green-100">API Key Generated</h4>
                                <p className="text-sm text-green-700 dark:text-green-300 mt-1 mb-2">
                                    Copy this key now. It will be hidden after refresh.
                                </p>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                    <code className="bg-background/50 px-2 py-1 rounded text-sm font-mono break-all border border-border flex-1">
                                        {newlyGeneratedKey}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(newlyGeneratedKey, 'new')}
                                        className="min-h-[44px] min-w-[44px] flex-shrink-0"
                                    >
                                        {copiedId === 'new' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {isLoadingKeys ? (
                        <div className="flex justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : apiKeys.length === 0 ? (
                        <EmptyState
                            icon={Key}
                            title="No API keys"
                            description="Generate an API key to get started with the Custom GPT API."
                        />
                    ) : (
                        apiKeys.map((apiKey) => (
                            <div key={apiKey.$id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card/50">
                                <div className="space-y-1 min-w-0">
                                    <div className="font-mono text-sm text-muted-foreground truncate">
                                        {apiKey.key.substring(0, 6)}...{apiKey.key.substring(apiKey.key.length - 4)}
                                    </div>
                                    <div className="text-xs text-muted-foreground/70">
                                        Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteClick(apiKey.$id)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px] min-w-[44px] self-end sm:self-auto"
                                    aria-label="Delete API key"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, keyId: null })}
                onConfirm={() => {
                    if (confirmDialog.keyId) {
                        deleteApiKey(confirmDialog.keyId);
                    }
                }}
                title="Delete API Key"
                message="Are you sure you want to delete this API key? This action cannot be undone and any applications using this key will stop working."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
