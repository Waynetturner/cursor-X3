ALTER TABLE workout_exercises 
DROP CONSTRAINT IF EXISTS workout_exercises_workout_type_check;

ALTER TABLE workout_exercises 
ADD CONSTRAINT workout_exercises_workout_type_check 
CHECK (workout_type IN ('Push', 'Pull', 'Rest', 'Missed'));

INSERT INTO workout_exercises (
  user_id,
  workout_local_date_time,
  workout_type,
  week_number,
  exercise_name,
  band_color,
  full_reps,
  partial_reps,
  notes
) VALUES 
('USER_ID_HERE', '2025-07-30T00:00:00Z', 'Missed', 62, NULL, NULL, NULL, NULL, 'Missed'),
('USER_ID_HERE', '2025-07-31T00:00:00Z', 'Missed', 62, NULL, NULL, NULL, NULL, 'Missed'),
('USER_ID_HERE', '2025-08-02T00:00:00Z', 'Missed', 62, NULL, NULL, NULL, NULL, 'Missed');
