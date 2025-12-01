'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { databases, appwriteStorage } from '@/lib/appwrite';
import { ID, Query, Permission, Role } from 'appwrite';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Resource } from '@/types';
import { Download, FileIcon, Trash2, Upload, RefreshCw, FolderOpen } from 'lucide-react';

export default function ResourcesPage() {
    const { user } = useAuth();
    const { success, error: showError, loading: showLoading, removeToast } = useToast();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        resource: Resource | null;
    }>({
        isOpen: false,
        resource: null,
    });

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const bucketId = 'resources';

    const fetchResources = useCallback(async () => {
        if (!user) return;
        try {
            setHasError(false);
            const response = await databases.listDocuments(dbId, 'resources', [
                Query.equal('userId', user.$id),
                Query.orderDesc('$createdAt'),
            ]);
            setResources(response.documents as unknown as Resource[]);
        } catch (err) {
            console.error('Error fetching resources:', err);
            setHasError(true);
            showError('Failed to load resources. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user, dbId, showError]);

    useEffect(() => {
        if (user) {
            fetchResources();
        }
    }, [user, fetchResources]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const loadingToastId = showLoading(`Uploading ${file.name}...`);
        
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
            removeToast(loadingToastId);
            success(`${file.name} uploaded successfully! 📁`);
        } catch (err) {
            console.error('Error uploading file:', err);
            removeToast(loadingToastId);
            showError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const downloadResource = (fileId: string, title: string) => {
        const url = appwriteStorage.getFileDownload(bucketId, fileId);
        window.open(url, '_blank');
        success(`Downloading ${title}...`);
    };

    const deleteResource = async (resource: Resource) => {
        try {
            await appwriteStorage.deleteFile(bucketId, resource.fileId);
            await databases.deleteDocument(dbId, 'resources', resource.$id);
            setResources(resources.filter(r => r.$id !== resource.$id));
            success('File deleted successfully.');
        } catch (err) {
            console.error('Error deleting resource:', err);
            showError('Failed to delete file. Please try again.');
        }
    };

    const handleDeleteClick = (resource: Resource) => {
        setConfirmDialog({
            isOpen: true,
            resource,
        });
    };

    if (loading) {
        return <PageLoader text="Loading resources..." />;
    }

    if (hasError) {
        return (
            <div className="max-w-6xl mx-auto w-full">
                <EmptyState
                    icon={RefreshCw}
                    title="Failed to load resources"
                    description="We couldn't load your files. Please check your connection and try again."
                    action={
                        <Button onClick={fetchResources}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-foreground">Resources</h2>
                <div className="relative">
                    <input
                        type="file"
                        onChange={handleUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                        aria-label="Upload file"
                    />
                    <Button disabled={uploading} loading={uploading}>
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? 'Uploading...' : 'Upload File'}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {resources.map(resource => (
                    <Card key={resource.$id} className="p-5 flex flex-col justify-between min-h-[144px] hover:shadow-md hover:translate-y-[-1px] transition-all group">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3 overflow-hidden flex-1 min-w-0">
                                <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl flex-shrink-0 shadow-inner">
                                    <FileIcon className="h-6 w-6 text-foreground" />
                                </div>
                                <span 
                                    className="font-medium text-foreground truncate" 
                                    title={resource.title}
                                >
                                    {resource.title}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 mt-4">
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => downloadResource(resource.fileId, resource.title)} 
                                className="text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[44px] min-w-[44px]"
                                aria-label={`Download ${resource.title}`}
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDeleteClick(resource)} 
                                className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 min-h-[44px] min-w-[44px]"
                                aria-label={`Delete ${resource.title}`}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
                {resources.length === 0 && (
                    <div className="col-span-full">
                        <EmptyState
                            icon={FolderOpen}
                            title="No resources uploaded yet"
                            description="Upload files to keep them organized and easily accessible!"
                            action={
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={handleUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={uploading}
                                        aria-label="Upload file"
                                    />
                                    <Button disabled={uploading}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload File
                                    </Button>
                                </div>
                            }
                        />
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, resource: null })}
                onConfirm={() => {
                    if (confirmDialog.resource) {
                        deleteResource(confirmDialog.resource);
                    }
                }}
                title="Delete File"
                message={`Are you sure you want to delete "${confirmDialog.resource?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
