
/**
 * Helper to get local date string YYYY-MM-DD
 */
export const getLocalDateString = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Checks if a date string corresponds to today's local date
 */
export const isDateToday = (dateStr: string): boolean => {
    return dateStr === getLocalDateString();
};

/**
 * Helper to parse YYYY-MM-DD to a local Date object (00:00:00 local time)
 * This avoids UTC offset issues when using new Date('YYYY-MM-DD')
 */
const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

/**
 * Calculates current and longest streaks from completed dates.
 *
 * Algorithm Complexity:
 * - Time Complexity: O(N log N) dominated by sorting the unique dates.
 *   The subsequent linear scan to calculate streaks is O(N).
 *   Lookup operations are O(1) or O(N) depending on context, but the overall process is strictly bounded.
 * - Space Complexity: O(N) to store the unique sorted dates.
 *
 * Logic:
 * 1. Deduplicate and sort dates in ascending order.
 * 2. Iterate through the sorted dates once to calculate all streak runs.
 * 3. Track the maximum run found (longestStreak).
 * 4. Check if the sequence ending at the last date connects to Today or Yesterday to determine currentStreak.
 *
 * @param completedDates Array of date strings (YYYY-MM-DD)
 * @returns Object containing current streak and longest streak
 */
export const calculateStreaks = (completedDates: string[]): { streak: number, longestStreak: number } => {
    if (!completedDates || completedDates.length === 0) {
        return { streak: 0, longestStreak: 0 };
    }

    // O(N) - Create Set to deduplicate
    const dateSet = new Set(completedDates);

    // O(N log N) - Sort unique dates ascending
    const sortedDates = Array.from(dateSet).sort();

    const todayStr = getLocalDateString(new Date());

    // Calculate yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    let maxStreak = 0;
    let currentRun = 0;
    let lastDate: Date | null = null;

    // O(N) - Single pass iteration
    for (const dateStr of sortedDates) {
        const currentDate = parseLocalDate(dateStr);

        if (!lastDate) {
            currentRun = 1;
        } else {
            // Check if consecutive
            const diffTime = currentDate.getTime() - lastDate.getTime();
            // 1 day = 24 * 60 * 60 * 1000 = 86400000 ms
            // Allowing for slight variations if any (though these are normalized dates)
            // Ideally diff should be exactly 86400000
            const diffDays = Math.round(diffTime / 86400000);

            if (diffDays === 1) {
                currentRun++;
            } else {
                currentRun = 1; // Reset run
            }
        }

        if (currentRun > maxStreak) {
            maxStreak = currentRun;
        }

        lastDate = currentDate;
    }

    // Determine current streak
    // The loop finished, so `currentRun` holds the length of the streak ending at `sortedDates[sortedDates.length - 1]`
    let currentStreak = 0;
    const lastDateStr = sortedDates[sortedDates.length - 1];

    if (lastDateStr === todayStr || lastDateStr === yesterdayStr) {
        currentStreak = currentRun;
    }

    return { streak: currentStreak, longestStreak: maxStreak };
};
