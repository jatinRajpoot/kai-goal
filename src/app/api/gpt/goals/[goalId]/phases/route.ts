import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, databases, DATABASE_ID } from '@/lib/server/appwrite';
import { ID } from 'node-appwrite';

export async function POST(req: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey) {
        return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    const userId = await validateApiKey(apiKey);
    if (!userId) {
        return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    const { goalId } = await params;

    try {
        const body = await req.json();
        const { title, order } = body;

        if (!title || order === undefined) {
            return NextResponse.json({ error: 'Title and order are required' }, { status: 400 });
        }

        // Verify goal ownership (optional but recommended)
        try {
            const goal = await databases.getDocument(DATABASE_ID, 'goals', goalId);
            if (goal.userId !== userId) {
                 return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 });
            }
        } catch (e) {
             return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        const doc = await databases.createDocument(
            DATABASE_ID,
            'phases',
            ID.unique(),
            {
                title,
                order,
                goalId,
                isCompleted: false
            }
        );

        return NextResponse.json(doc, { status: 201 });
    } catch (error) {
        console.error('Error creating phase:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
