import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, databases, DATABASE_ID } from '@/lib/server/appwrite';
import { ID } from 'node-appwrite';

export async function POST(req: NextRequest, { params }: { params: Promise<{ phaseId: string }> }) {
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey) {
        return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    const userId = await validateApiKey(apiKey);
    if (!userId) {
        return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    const { phaseId } = await params;

    try {
        const body = await req.json();
        const { title, dueDate } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // Verify phase (and implicitly goal) ownership could be added here
        // For now, we trust the API key context and phase existence check

        // Check if phase exists
        try {
             // We can fetch the phase to ensure it exists and maybe check ownership via goal if we wanted to be strict
             await databases.getDocument(DATABASE_ID, 'phases', phaseId);
        } catch (e) {
             return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
        }

        const doc = await databases.createDocument(
            DATABASE_ID,
            'tasks',
            ID.unique(),
            {
                title,
                dueDate,
                phaseId,
                isCompleted: false,
                userId // Tasks have userId based on schema
            }
        );

        return NextResponse.json(doc, { status: 201 });
    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
