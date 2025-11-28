
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
 * Calculates current and longest streaks from completed dates
 */
export const calculateStreaks = (completedDates: string[]) => {
    if (!completedDates.length) {
        return { streak: 0, longestStreak: 0 };
    }

    // Sort unique dates descending for current streak
    const sortedDates = [...new Set(completedDates)].sort((a, b) => b.localeCompare(a));
    const todayStr = getLocalDateString(new Date());

    // Calculate yesterday properly
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    // Calculate Current Streak
    let currentStreak = 0;
    let streakStartDate: string | null = null;

    if (sortedDates.includes(todayStr)) {
        streakStartDate = todayStr;
    } else if (sortedDates.includes(yesterdayStr)) {
        streakStartDate = yesterdayStr;
    }

    if (streakStartDate) {
        currentStreak = 1;
        // Use the safe parser
        let checkDate = parseLocalDate(streakStartDate);

        // Loop backwards to find consecutive days
        while (true) {
            checkDate.setDate(checkDate.getDate() - 1);
            const checkStr = getLocalDateString(checkDate);
            if (sortedDates.includes(checkStr)) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    // Calculate Longest Streak
    // Sort ascending for easier sequential iteration
    const ascendingDates = [...sortedDates].reverse();
    let maxStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const dateStr of ascendingDates) {
        const currentDate = parseLocalDate(dateStr);

        if (!lastDate) {
            tempStreak = 1;
        } else {
            // Calculate difference in days safely
            // Using time difference on local dates (constructed at 00:00:00) works
            // because they are in the same timezone context.
            const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                tempStreak++;
            } else {
                tempStreak = 1;
            }
        }

        if (tempStreak > maxStreak) {
            maxStreak = tempStreak;
        }
        lastDate = currentDate;
    }

    return { streak: currentStreak, longestStreak: maxStreak };
};
