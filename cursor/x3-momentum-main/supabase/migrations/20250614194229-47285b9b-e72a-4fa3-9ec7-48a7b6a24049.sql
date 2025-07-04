
-- Delete the duplicate workout that has no exercises
-- This will identify and delete the workout with 0 exercises on 6/4/25
DELETE FROM workouts 
WHERE id IN (
  SELECT w.id
  FROM workouts w
  LEFT JOIN exercises e ON w.id = e.workout_id
  WHERE w.date = '2025-06-04' 
    AND w.workout_type = 'Push'
  GROUP BY w.id
  HAVING COUNT(e.id) = 0
);

-- Verify the deletion by checking remaining workouts for that date
SELECT 
  w.id,
  w.date,
  w.workout_type,
  w.week_number,
  w.created_at,
  COUNT(e.id) as exercise_count
FROM workouts w
LEFT JOIN exercises e ON w.id = e.workout_id
WHERE w.date = '2025-06-04' 
  AND w.workout_type = 'Push'
GROUP BY w.id, w.date, w.workout_type, w.week_number, w.created_at
ORDER BY w.created_at;
