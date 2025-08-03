const startDate = '2024-05-28';
const testDate = '2025-08-01';

console.log('=== DEBUGGING WEEK CALCULATION ISSUE ===');
console.log('');

const start = new Date(startDate);
const target = new Date(testDate);
start.setHours(0, 0, 0, 0);
target.setHours(0, 0, 0, 0);

const daysSinceStart = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
const calculatedWeek = Math.floor(daysSinceStart / 7) + 1;

console.log(`Start: ${startDate}, Target: ${testDate}`);
console.log(`Days since start: ${daysSinceStart}`);
console.log(`Calculated week: ${calculatedWeek}`);
console.log('');

console.log('If 8/1/25 should be week 10:');
const expectedWeek = 10;
const expectedDays = (expectedWeek - 1) * 7;

const calculatedStart = new Date(target);
calculatedStart.setDate(calculatedStart.getDate() - expectedDays);

console.log(`Expected days from start: ${expectedDays}`);
console.log(`Calculated start date for week 10: ${calculatedStart.toISOString().split('T')[0]}`);
console.log('');

console.log('POSSIBLE CAUSES:');
console.log('1. User has different start date than 2024-05-28 in their profile');
console.log('2. Program was restarted, resetting week counting');
console.log('3. Database has different start date than expected');
console.log('');
console.log('RECOMMENDATION:');
console.log('Check the actual start date in the user\'s Supabase profile table');
console.log('The x3_start_date field should contain the correct start date');
console.log('If it shows 2025-05-30, that would explain why 8/1/25 is week 10');
