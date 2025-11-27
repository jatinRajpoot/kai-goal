'use client';

import React, { useState, useEffect } from 'react';
import { databases, appwriteStorage } from '@/lib/appwrite';
import { ID, Query, Permission, Role } from 'appwrite';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Resource } from '@/types';
import { Download, FileIcon, Trash2, Upload } from 'lucide-react';

export default function ResourcesPage() {
    const { user } = useAuth();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const bucketId = 'resources'; // We created this bucket in setup script

    useEffect(() => {
        if (user) {
            fetchResources();
        }
    }, [user]);

    const fetchResources = async () => {
        try {
            const response = await databases.listDocuments(dbId, 'resources', [
                Query.equal('userId', user!.$id),
                Query.orderDesc('$createdAt'),
            ]);
            setResources(response.documents as unknown as Resource[]);
        } catch (error) {
            console.error('Error fetching resources:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // 1. Upload file to Storage with user permissions
            const fileUpload = await appwriteStorage.createFile(bucketId, ID.unique(), file, [
                Permission.read(Role.user(user!.$id)),
                Permission.update(Role.user(user!.$id)),
                Permission.delete(Role.user(user!.$id)),
            ]);

            // 2. Create Resource document
            const resourceDoc = await databases.createDocument(dbId, 'resources', ID.unique(), {
                title: file.name,
                fileId: fileUpload.$id,
                bucketId: bucketId,
                userId: user!.$id,
            }, [
                Permission.read(Role.user(user!.$id)),
                Permission.update(Role.user(user!.$id)),
                Permission.delete(Role.user(user!.$id)),
            ]);

            setResources([resourceDoc as unknown as Resource, ...resources]);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Upload failed');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const downloadResource = (fileId: string) => {
        const url = appwriteStorage.getFileDownload(bucketId, fileId);
        window.open(url, '_blank');
    };

    const deleteResource = async (resource: Resource) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            await appwriteStorage.deleteFile(bucketId, resource.fileId);
            await databases.deleteDocument(dbId, 'resources', resource.$id);
            setResources(resources.filter(r => r.$id !== resource.$id));
        } catch (error) {
            console.error('Error deleting resource:', error);
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
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resources</h2>
                <div className="relative">
                    <input
                        type="file"
                        onChange={handleUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                    />
                    <Button disabled={uploading}>
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? 'Uploading...' : 'Upload File'}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {resources.map(resource => (
                    <Card key={resource.$id} className="p-5 flex flex-col justify-between h-36 hover:shadow-lg transition-all group">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <div className="p-3 bg-primary/5 rounded-xl">
                                    <FileIcon className="h-6 w-6 text-primary" />
                                </div>
                                <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors" title={resource.title}>{resource.title}</span>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 mt-4">
                            <Button size="sm" variant="ghost" onClick={() => downloadResource(resource.fileId)} className="text-muted-foreground hover:text-primary">
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteResource(resource)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
                {resources.length === 0 && (
                    <Card className="col-span-full flex flex-col items-center justify-center py-12">
                        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-lg">No resources uploaded yet.</p>
                        <p className="text-muted-foreground/70 text-sm">Upload files to keep them organized!</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
