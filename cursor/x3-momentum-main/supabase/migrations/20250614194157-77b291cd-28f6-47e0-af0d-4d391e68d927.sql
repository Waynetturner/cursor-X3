
-- First, let's see the duplicate workouts on 6/4/25
SELECT 
  w.id,
  w.date,
  w.workout_type,
  w.week_number,
  w.created_at,
  w.user_id,
  COUNT(e.id) as exercise_count
FROM workouts w
LEFT JOIN exercises e ON w.id = e.workout_id
WHERE w.date = '2025-06-04' 
  AND w.workout_type = 'Push'
GROUP BY w.id, w.date, w.workout_type, w.week_number, w.created_at, w.user_id
ORDER BY w.created_at;

-- Let's also see what exercises are associated with each workout
SELECT 
  w.id as workout_id,
  w.created_at as workout_created,
  e.exercise_name,
  e.full_reps,
  e.partial_reps,
  e.band_color,
  e.created_at as exercise_created
FROM workouts w
LEFT JOIN exercises e ON w.id = e.workout_id
WHERE w.date = '2025-06-04' 
  AND w.workout_type = 'Push'
ORDER BY w.created_at, e.exercise_name;
