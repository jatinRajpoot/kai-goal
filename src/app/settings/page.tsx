'use client';

import React, { useState, useEffect } from 'react';
import { account, databases } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ID, Query, Permission, Role } from 'appwrite';
import { Trash2, Key, Copy, Check, RefreshCw, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiKey {
    $id: string;
    key: string;
    createdAt: string;
    userId: string;
}

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const [name, setName] = useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [isLoadingKeys, setIsLoadingKeys] = useState(true);
    const [isGeneratingKey, setIsGeneratingKey] = useState(false);
    const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

    useEffect(() => {
        const fetchApiKeys = async () => {
            if (!user || !dbId) return;
            setIsLoadingKeys(true);
            try {
                const response = await databases.listDocuments(
                    dbId,
                    'api_keys',
                    [Query.equal('userId', user.$id)]
                );
                setApiKeys(response.documents as unknown as ApiKey[]);
            } catch (error) {
                console.error('Error fetching API keys:', error);
            } finally {
                setIsLoadingKeys(false);
            }
        };

        if (user) {
            setName(user.name);
            fetchApiKeys();
        }
    }, [user, dbId]);

    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsUpdatingProfile(true);
        try {
            await account.updateName(name);
            await refreshUser();
            // Optional: Show success toast
        } catch (error) {
            console.error('Error updating profile:', error);
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
        } catch (error) {
            console.error('Error generating API key:', error);
        } finally {
            setIsGeneratingKey(false);
        }
    };

    const deleteApiKey = async (id: string) => {
        if (!dbId) return;
        if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;

        try {
            await databases.deleteDocument(dbId, 'api_keys', id);
            setApiKeys(prev => prev.filter(k => k.$id !== id));
        } catch (error) {
            console.error('Error deleting API key:', error);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
                <p className="text-muted-foreground mt-1">Manage your account and developer settings.</p>
            </div>

            {/* Profile Section */}
            <Card className="p-6">
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
                    <Button type="submit" disabled={isUpdatingProfile || name === user?.name}>
                        {isUpdatingProfile && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                        Update Profile
                    </Button>
                </form>
            </Card>

            {/* API Keys Section */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        <div>
                            <h3 className="font-semibold text-lg">API Keys</h3>
                            <p className="text-sm text-muted-foreground">Manage keys for accessing your data via the Custom GPT API.</p>
                        </div>
                    </div>
                    <Button onClick={generateApiKey} disabled={isGeneratingKey}>
                        {isGeneratingKey && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                        Generate New Key
                    </Button>
                </div>

                {newlyGeneratedKey && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-medium text-green-900 dark:text-green-100">API Key Generated</h4>
                                <p className="text-sm text-green-700 dark:text-green-300 mt-1 mb-2">
                                    Copy this key now. It will be hidden after refresh.
                                </p>
                                <div className="flex items-center gap-2">
                                    <code className="bg-background/50 px-2 py-1 rounded text-sm font-mono break-all border border-border">
                                        {newlyGeneratedKey}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(newlyGeneratedKey, 'new')}
                                        className="h-8 w-8 p-0"
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
                        <div className="text-center py-8 text-muted-foreground">
                            No API keys found. Generate one to get started.
                        </div>
                    ) : (
                        apiKeys.map((apiKey) => (
                            <div key={apiKey.$id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                                <div className="space-y-1">
                                    <div className="font-mono text-sm text-muted-foreground">
                                        {/* Mask key unless it's the one we just generated (though we don't store that ref easily here, so we just mask all existing from DB) */}
                                        {apiKey.key.substring(0, 6)}...{apiKey.key.substring(apiKey.key.length - 4)}
                                    </div>
                                    <div className="text-xs text-muted-foreground/70">
                                        Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteApiKey(apiKey.$id)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
