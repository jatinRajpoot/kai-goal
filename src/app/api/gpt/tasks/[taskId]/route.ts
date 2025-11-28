import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, databases, DATABASE_ID } from '@/lib/server/appwrite';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey) {
        return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    const userId = await validateApiKey(apiKey);
    if (!userId) {
        return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    const { taskId } = await params;

    try {
        const body = await req.json();
        const { isCompleted } = body;

        if (isCompleted === undefined) {
            return NextResponse.json({ error: 'isCompleted is required' }, { status: 400 });
        }

        const task = await databases.getDocument(DATABASE_ID, 'tasks', taskId);

        if (task.userId !== userId) {
             return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
        }

        const doc = await databases.updateDocument(
            DATABASE_ID,
            'tasks',
            taskId,
            {
                isCompleted,
            }
        );

        return NextResponse.json(doc, { status: 200 });
    } catch (error) {
        console.error('Error updating task:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
