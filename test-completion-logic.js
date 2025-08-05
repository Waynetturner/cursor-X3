console.log('🧪 Testing Completion-Based Workout Week Progression');
console.log('=' .repeat(60));

const mockCompletedWorkouts = new Set([
  '2024-08-01', // Week 10 Day 1 - Push (completed)
  '2024-08-02', // Week 10 Day 2 - Pull (completed) 
  '2024-08-03', // Week 10 Day 3 - Push (completed - this is what user mentioned)
]);

const startDate = '2024-07-01'; // Assuming user started July 1st
const today = '2024-08-05';

const start = new Date(startDate + 'T00:00:00.000Z');
const current = new Date(today);
const daysSinceStart = Math.floor((current - start) / (1000 * 60 * 60 * 24));

console.log(`📅 Start Date: ${startDate}`);
console.log(`📅 Current Date: ${today}`);
console.log(`📊 Days Since Start: ${daysSinceStart}`);
console.log(`📋 Mock Completed Dates: ${Array.from(mockCompletedWorkouts).join(', ')}`);

let actualCurrentWeek = 1;
let completedWorkoutsInCurrentWeek = 0;

console.log('\n🔄 Processing workout completion sequence...');

for (let day = 0; day < daysSinceStart; day++) {
  const checkDate = new Date(start);
  checkDate.setDate(start.getDate() + day);
  const checkDateStr = checkDate.toISOString().split('T')[0];
  
  const calendarWeek = Math.floor(day / 7) + 1;
  const schedule = calendarWeek <= 4 
    ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest']
    : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'];
  
  const scheduledWorkout = schedule[day % 7];
  const wasCompleted = mockCompletedWorkouts.has(checkDateStr);
  
  console.log(`Day ${day + 1} (${checkDateStr}): Scheduled=${scheduledWorkout}, Completed=${wasCompleted ? 'Yes' : 'No'}`);
  
  if (wasCompleted || scheduledWorkout === 'Rest') {
    completedWorkoutsInCurrentWeek++;
    
    if (completedWorkoutsInCurrentWeek === 7) {
      console.log(`✅ Week ${actualCurrentWeek} completed! Moving to week ${actualCurrentWeek + 1}`);
      actualCurrentWeek++;
      completedWorkoutsInCurrentWeek = 0;
    }
  } else {
    console.log(`❌ Missed workout - week progression stops until caught up`);
    break;
  }
}

const currentWeekSchedule = actualCurrentWeek <= 4 
  ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest']
  : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'];

const nextWorkoutType = currentWeekSchedule[completedWorkoutsInCurrentWeek];

console.log('\n📊 RESULTS:');
console.log(`🏆 Completion-Based Week: ${actualCurrentWeek}`);
console.log(`📈 Workouts Completed in Current Week: ${completedWorkoutsInCurrentWeek}/7`);
console.log(`🎯 Next Workout Needed: ${nextWorkoutType}`);
console.log(`📍 Position in Week: ${completedWorkoutsInCurrentWeek + 1}/7`);

console.log('\n✅ VERIFICATION:');
if (nextWorkoutType === 'Push') {
  console.log('✅ SUCCESS: Today (8/5) should show Push workout (not Rest)');
  console.log('✅ This matches user expectation - Rest day was incorrectly shown');
} else {
  console.log('❌ ISSUE: Expected Push workout for today, but got:', nextWorkoutType);
}

console.log('\n' + '='.repeat(60));
console.log('🎯 FINAL TEST RESULT:', nextWorkoutType === 'Push' ? 'PASSED ✅' : 'FAILED ❌');
console.log('='.repeat(60));
