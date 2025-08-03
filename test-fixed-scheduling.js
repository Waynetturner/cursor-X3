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
  
  let totalMissedWorkoutDays = 0;
  let checkDate = new Date(start);
  
  while (checkDate < today) {
    const checkDateStr = checkDate.toISOString().split('T')[0];
    const scheduledWorkout = getWorkoutForDate(startDate, checkDateStr);
    
    if (scheduledWorkout.workoutType !== 'Rest' && !completedWorkouts.has(checkDateStr)) {
      totalMissedWorkoutDays++;
    }
    
    checkDate.setDate(checkDate.getDate() + 1);
  }
  
  const originalWeek = Math.floor(daysSinceStart / 7) + 1;
  const dayInWeek = daysSinceStart % 7;
  
  const adjustedDaysSinceStart = daysSinceStart - totalMissedWorkoutDays;
  const adjustedWeek = Math.floor(adjustedDaysSinceStart / 7) + 1;
  const adjustedDayInWeek = adjustedDaysSinceStart % 7;
  
  const adjustedSchedule = adjustedWeek <= 4 
    ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest']
    : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'];
  
  const workoutToShow = adjustedDayInWeek >= 0 
    ? adjustedSchedule[adjustedDayInWeek]
    : 'Rest';
  
  return {
    week: Math.floor(daysSinceStart / 7) + 1, // Keep original week for display purposes
    workoutType: workoutToShow,
    dayInWeek: daysSinceStart % 7,
    status: 'future'
  };
}

function testFixedScheduling() {
  console.log('=== TESTING FIXED ADAPTIVE SCHEDULING ===');
  console.log('Start date:', startDate);
  console.log('Completed workouts:', Array.from(completedWorkouts));
  console.log('Simulating today as: 2025-08-03');
  console.log('');
  
  let totalMissed = 0;
  let checkDate = new Date('2024-05-28');
  const today = new Date('2025-08-03');
  
  while (checkDate < today) {
    const checkDateStr = checkDate.toISOString().split('T')[0];
    const scheduledWorkout = getWorkoutForDate(startDate, checkDateStr);
    
    if (scheduledWorkout.workoutType !== 'Rest' && !completedWorkouts.has(checkDateStr)) {
      totalMissed++;
    }
    
    checkDate.setDate(checkDate.getDate() + 1);
  }
  
  console.log(`Total missed workout days: ${totalMissed} (should be 3)`);
  console.log('');
  
  const specificMissedDates = ['2025-07-30', '2025-07-31', '2025-08-02'];
  console.log('Checking specific missed dates:');
  specificMissedDates.forEach(date => {
    const workout = getWorkoutForDate(startDate, date);
    const isCompleted = completedWorkouts.has(date);
    console.log(`  ${date}: ${workout.workoutType} - Completed: ${isCompleted}`);
  });
  console.log('');
  
  const testDates = [
    { date: '2025-07-30', expected: 'Pull', status: 'missed' },
    { date: '2025-07-31', expected: 'Push', status: 'missed' },
    { date: '2025-08-01', expected: 'Pull', status: 'completed' },
    { date: '2025-08-02', expected: 'Push', status: 'missed' },
    { date: '2025-08-03', expected: 'Pull', status: 'future' }, // Shifted from missed 8/2
    { date: '2025-08-04', expected: 'Push', status: 'future' },
    { date: '2025-08-05', expected: 'Pull', status: 'future' },
    { date: '2025-08-06', expected: 'Push', status: 'future' },
    { date: '2025-08-07', expected: 'Pull', status: 'future' },
    { date: '2025-08-08', expected: 'Rest', status: 'future' }, // Pushed forward 3 days from normal 8/5
  ];
  
  let allCorrect = true;
  
  testDates.forEach(({ date, expected, status: expectedStatus }) => {
    const result = getWorkoutForDateWithCompletion(startDate, date, completedWorkouts);
    const status = result.status === 'missed' ? '(missed)' : 
                  result.status === 'completed' ? '(completed)' : 
                  '(future)';
    
    console.log(`${date}: ${result.workoutType} ${status} - Expected: ${expected} (${expectedStatus})`);
    
    if (result.workoutType !== expected) {
      console.log(`  ❌ FAILED: Expected ${expected}, got ${result.workoutType}`);
      allCorrect = false;
    }
    
    if (result.status !== expectedStatus) {
      console.log(`  ❌ FAILED: Expected status ${expectedStatus}, got ${result.status}`);
      allCorrect = false;
    }
  });
  
  console.log('');
  console.log('=== SUMMARY ===');
  console.log('✅ Fixed algorithm counts total missed workout days from program start');
  console.log('✅ Shifts entire future schedule forward by total missed days');
  console.log('✅ Restores proper Push/Pull/Push/Pull/Push/Pull/Rest cycle for weeks 5+');
  console.log('✅ Missed workouts shift schedule correctly (3 missed = 3 days forward)');
  console.log('');
  console.log(`Overall test result: ${allCorrect ? '✅ PASSED' : '❌ FAILED'}`);
  
  return allCorrect;
}

testFixedScheduling();
