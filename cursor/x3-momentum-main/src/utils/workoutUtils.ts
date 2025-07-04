
// Configuration matching your original app
const START_DATE = new Date('2025-05-28T00:00:00');

// Exercise order for consistent display and progression tracking
export const PUSH_EXERCISES = ['Chest Press', 'Tricep Press', 'Overhead Press', 'Front Squat'];
export const PULL_EXERCISES = ['Deadlift', 'Bent Row', 'Bicep Curl', 'Calf Raise'];

const WEEKS_1_4_SCHEDULE = ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest'];
const WEEKS_5_12_SCHEDULE = ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'];

export function getDaysSinceStart(): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - START_DATE.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function getWeekAndDay() {
  const daysSinceStart = getDaysSinceStart();
  const currentWeek = Math.floor(daysSinceStart / 7) + 1;
  const dayOfWeek = daysSinceStart % 7;
  
  return {
    currentWeek,
    dayOfWeek,
    todaysWorkout: getTodaysWorkout(currentWeek, dayOfWeek)
  };
}

export function getTodaysWorkout(currentWeek?: number, dayOfWeek?: number): string {
  if (currentWeek === undefined || dayOfWeek === undefined) {
    const { currentWeek: week, dayOfWeek: day } = getWeekAndDay();
    currentWeek = week;
    dayOfWeek = day;
  }
  
  const schedule = currentWeek <= 4 ? WEEKS_1_4_SCHEDULE : WEEKS_5_12_SCHEDULE;
  return schedule[dayOfWeek];
}
