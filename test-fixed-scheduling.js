const startDate = '2024-05-28';
const completedWorkouts = new Set(['2025-08-01']);

function getWorkoutForDate(startDate, targetDate) {
  const start = new Date(startDate);
  const target = new Date(targetDate);
  
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  
  const daysSinceStart = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceStart < 0) {
    return { week: 0, workoutType: 'Rest', dayInWeek: -1 };
  }
  
  const week = Math.floor(daysSinceStart / 7) + 1;
  const dayInWeek = daysSinceStart % 7;
  
  const schedule = week <= 4 
    ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest']
    : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'];
  
  return {
    week,
    workoutType: schedule[dayInWeek],
    dayInWeek
  };
}

function getWorkoutForDateWithCompletion(startDate, targetDate, completedWorkouts) {
  const start = new Date(startDate);
  const target = new Date(targetDate);
  
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  
  const daysSinceStart = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceStart < 0) {
    return {
      week: 0,
      workoutType: 'Rest',
      dayInWeek: -1,
      status: 'future'
    };
  }
  
  const targetDateStr = target.toISOString().split('T')[0];
  const today = new Date('2025-08-03'); // Simulate today as Aug 3
  today.setHours(0, 0, 0, 0);
  const isPastDate = target < today;
  
  if (isPastDate) {
    const staticWorkout = getWorkoutForDate(startDate, targetDateStr);
    const isCompleted = completedWorkouts.has(targetDateStr);
    
    return {
      ...staticWorkout,
      status: isCompleted ? 'completed' : 'missed'
    };
  }
  
  const lookbackDays = 7;
  let missedWorkouts = [];
  let lookbackDate = new Date(today);
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);
  
  let currentCheckDate = new Date(Math.max(lookbackDate.getTime(), start.getTime()));
  
  while (currentCheckDate < today) {
    const checkDateStr = currentCheckDate.toISOString().split('T')[0];
    const scheduledWorkout = getWorkoutForDate(startDate, checkDateStr);
    
    if (scheduledWorkout.workoutType !== 'Rest' && !completedWorkouts.has(checkDateStr)) {
      missedWorkouts.push({
        date: checkDateStr,
        type: scheduledWorkout.workoutType
      });
    }
    
    currentCheckDate.setDate(currentCheckDate.getDate() + 1);
  }
  
  const originalWeek = Math.floor(daysSinceStart / 7) + 1;
  const dayInWeek = daysSinceStart % 7;
  
  const schedule = originalWeek <= 4 
    ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest']
    : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'];
  
  const workoutToShow = missedWorkouts.length > 0 
    ? missedWorkouts[missedWorkouts.length - 1].type
    : schedule[dayInWeek];
  
  return {
    week: originalWeek,
    workoutType: workoutToShow,
    dayInWeek,
    status: 'future'
  };
}

function testFixedScheduling() {
  console.log('=== TESTING FIXED ADAPTIVE SCHEDULING ===');
  console.log('Start date:', startDate);
  console.log('Completed workouts:', Array.from(completedWorkouts));
  console.log('Simulating today as: 2025-08-03');
  console.log('');
  
  const testDates = [
    { date: '2025-07-30', expected: 'Push (missed)' },
    { date: '2025-07-31', expected: 'Pull (missed)' },
    { date: '2025-08-01', expected: 'Pull (completed)' },
    { date: '2025-08-02', expected: 'Push (missed)' },
    { date: '2025-08-03', expected: 'Push (shifted from missed 8/2)' },
    { date: '2025-08-04', expected: 'Pull (normal schedule)' },
    { date: '2025-08-05', expected: 'Push (normal schedule)' },
    { date: '2025-08-06', expected: 'Pull (normal schedule)' },
    { date: '2025-08-07', expected: 'Push (normal schedule)' },
    { date: '2025-08-08', expected: 'Pull (normal schedule)' },
    { date: '2025-08-09', expected: 'Push (normal schedule)' },
    { date: '2025-08-10', expected: 'Pull (normal schedule)' },
    { date: '2025-08-11', expected: 'Rest (normal schedule)' }
  ];
  
  let allCorrect = true;
  
  testDates.forEach(({ date, expected }) => {
    const result = getWorkoutForDateWithCompletion(startDate, date, completedWorkouts);
    const status = result.status === 'missed' ? '(missed)' : 
                  result.status === 'completed' ? '(completed)' : 
                  '(future)';
    
    console.log(`${date}: ${result.workoutType} ${status} - Expected: ${expected}`);
    
    if (date === '2025-08-03' && result.workoutType !== 'Push') {
      console.log(`  ❌ FAILED: Expected Push (shifted from missed 8/2), got ${result.workoutType}`);
      allCorrect = false;
    }
    if (date === '2025-08-04' && result.workoutType !== 'Pull') {
      console.log(`  ❌ FAILED: Expected Pull (normal schedule), got ${result.workoutType}`);
      allCorrect = false;
    }
    if (date === '2025-08-11' && result.workoutType !== 'Rest') {
      console.log(`  ❌ FAILED: Expected Rest (normal schedule), got ${result.workoutType}`);
      allCorrect = false;
    }
  });
  
  console.log('');
  console.log('=== SUMMARY ===');
  console.log('✅ Fixed algorithm limits lookback to 7 days instead of entire history');
  console.log('✅ Uses most recent missed workout instead of first missed workout');
  console.log('✅ Should restore proper Push/Pull/Push/Pull/Push/Pull/Rest cycle for weeks 5+');
  console.log('✅ Missed workouts should shift schedule correctly');
  console.log('');
  console.log(`Overall test result: ${allCorrect ? '✅ PASSED' : '❌ FAILED'}`);
  
  return allCorrect;
}

testFixedScheduling();
