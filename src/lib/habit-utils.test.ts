
import { calculateStreaks, getLocalDateString } from './habit-utils';

const runTests = () => {
    console.log('Running calculateStreaks tests...');

    const today = new Date();
    const todayStr = getLocalDateString(today);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = getLocalDateString(twoDaysAgo);

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = getLocalDateString(threeDaysAgo);

    // Test Case 1: Empty array
    let result = calculateStreaks([]);
    console.assert(result.streak === 0 && result.longestStreak === 0, 'Test 1 Failed: Empty array');

    // Test Case 2: Single date (Today)
    result = calculateStreaks([todayStr]);
    console.assert(result.streak === 1 && result.longestStreak === 1, 'Test 2 Failed: Single date (Today)');

    // Test Case 3: Single date (Yesterday)
    result = calculateStreaks([yesterdayStr]);
    console.assert(result.streak === 1 && result.longestStreak === 1, 'Test 3 Failed: Single date (Yesterday)');

    // Test Case 4: Single date (Two days ago) - Streak broken
    result = calculateStreaks([twoDaysAgoStr]);
    console.assert(result.streak === 0 && result.longestStreak === 1, `Test 4 Failed: Single date (Two days ago). Got: ${JSON.stringify(result)}`);

    // Test Case 5: Consecutive days (Today, Yesterday)
    result = calculateStreaks([todayStr, yesterdayStr]);
    console.assert(result.streak === 2 && result.longestStreak === 2, 'Test 5 Failed: Consecutive days (Today, Yesterday)');

    // Test Case 6: Consecutive days (Yesterday, 2 days ago)
    result = calculateStreaks([yesterdayStr, twoDaysAgoStr]);
    console.assert(result.streak === 2 && result.longestStreak === 2, 'Test 6 Failed: Consecutive days (Yesterday, 2 days ago)');

    // Test Case 7: Gap in dates (Today, 2 days ago)
    result = calculateStreaks([todayStr, twoDaysAgoStr]);
    console.assert(result.streak === 1 && result.longestStreak === 1, 'Test 7 Failed: Gap in dates (Today, 2 days ago)');

    // Test Case 8: Longest streak in past
    // Today (streak=1), Gap, 4 consecutive days in past
    const pastDates = [
        '2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04'
    ];
    result = calculateStreaks([todayStr, ...pastDates]);
    // Note: This relies on "today" not being consecutive with 2023-01-04. Assuming today is 2024 or later.
    // If today is close to 2023-01-04 this might fail.
    // Let's use relative dates for safety.
    const d1 = new Date(); d1.setDate(d1.getDate() - 10);
    const d2 = new Date(); d2.setDate(d2.getDate() - 11);
    const d3 = new Date(); d3.setDate(d3.getDate() - 12);
    const d4 = new Date(); d4.setDate(d4.getDate() - 13);
    const pastRelative = [getLocalDateString(d1), getLocalDateString(d2), getLocalDateString(d3), getLocalDateString(d4)];

    result = calculateStreaks([todayStr, ...pastRelative]);
    console.assert(result.streak === 1 && result.longestStreak === 4, `Test 8 Failed: Longest streak in past. Got ${JSON.stringify(result)}`);

    // Test Case 9: Duplicates
    result = calculateStreaks([todayStr, todayStr, yesterdayStr]);
    console.assert(result.streak === 2 && result.longestStreak === 2, 'Test 9 Failed: Duplicates');

    // Test Case 10: Unsorted
    result = calculateStreaks([twoDaysAgoStr, todayStr, yesterdayStr]);
    console.assert(result.streak === 3 && result.longestStreak === 3, 'Test 10 Failed: Unsorted');

    console.log('All tests finished.');
};

runTests();
