import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, databases, DATABASE_ID } from '@/lib/server/appwrite';
import { ID, Permission, Role } from 'node-appwrite';

export async function POST(req: NextRequest) {
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey) {
        return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    const userId = await validateApiKey(apiKey);
    if (!userId) {
        return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    const db = databases();
    const dbId = DATABASE_ID();

    try {
        const body = await req.json();
        const { title, description, deadline } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const doc = await db.createDocument(
            dbId,
            'goals',
            ID.unique(),
            {
                title,
                description,
                deadline,
                userId,
            },
            [
                Permission.read(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ]
        );

        return NextResponse.json(doc, { status: 201 });
    } catch (error) {
        console.error('Error creating goal:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
