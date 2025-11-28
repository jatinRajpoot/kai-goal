import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, databases, DATABASE_ID } from '@/lib/server/appwrite';
import { calculateStreaks } from '@/lib/habit-utils';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ habitId: string }> }) {
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey) {
        return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    const userId = await validateApiKey(apiKey);
    if (!userId) {
        return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    const { habitId } = await params;

    try {
        const body = await req.json();
        const { date } = body;

        if (!date) {
            return NextResponse.json({ error: 'Date is required (YYYY-MM-DD)' }, { status: 400 });
        }

        // Fetch habit
        const habit = await databases.getDocument(DATABASE_ID, 'habits', habitId);

        if (habit.userId !== userId) {
            return NextResponse.json({ error: 'Habit not found or access denied' }, { status: 404 });
        }

        let completedDates = habit.completedDates || [];

        // Add date if not already present
        if (!completedDates.includes(date)) {
            completedDates.push(date);
        } else {
             // If already completed, we might want to return success or error.
             // The requirement says "Adds the date to completedDates (ensuring no duplicates)".
             // It doesn't explicitly say what to do if it's already there.
             // I'll assume idempotency is fine.
        }

        // Recalculate streaks
        const { streak, longestStreak } = calculateStreaks(completedDates);

        // Update habit
        const doc = await databases.updateDocument(
            DATABASE_ID,
            'habits',
            habitId,
            {
                completedDates,
                streak,
                longestStreak
            }
        );

        return NextResponse.json(doc, { status: 200 });
    } catch (error) {
        console.error('Error updating habit:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
