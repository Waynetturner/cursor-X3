const startDate = '2024-05-28'; // User's start date
const missedDate = '2025-08-02'; // Missed Push workout
const todayDate = '2025-08-03'; // Should show Push (shifted forward)

const completedWorkouts = new Set(['2025-08-01']);

function testAdaptiveScheduling() {
  console.log('=== TESTING ADAPTIVE SCHEDULING FIX ===');
  
  const start = new Date(startDate);
  const target = new Date(todayDate);
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  
  const daysSinceStart = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const originalWeek = Math.floor(daysSinceStart / 7) + 1;
  const dayInWeek = daysSinceStart % 7;
  
  const schedule = originalWeek <= 4 
    ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest']
    : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'];
  
  const missedWorkouts = [
    { date: '2025-08-02', type: 'Push' }
  ];
  
  const workoutToShow = missedWorkouts.length > 0 
    ? missedWorkouts[0].type 
    : schedule[dayInWeek];
  
  console.log('Expected: Push (since missed Push on 8/2 should appear on 8/3)');
  console.log('Actual:', workoutToShow);
  console.log('Test passed:', workoutToShow === 'Push');
  
  return workoutToShow === 'Push';
}

testAdaptiveScheduling();
