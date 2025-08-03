

INSERT INTO workout_exercises (
  user_id,
  workout_local_date_time,
  workout_type,
  exercise_name,
  band_color,
  full_reps,
  partial_reps,
  notes
) VALUES 
(
  (SELECT id FROM auth.users WHERE email = 'wayne@waynetturner.com'),
  '2025-07-30T00:00:00.000Z',
  'Missed',
  NULL,
  NULL,
  NULL,
  NULL,
  'Missed'
),
(
  (SELECT id FROM auth.users WHERE email = 'wayne@waynetturner.com'),
  '2025-07-31T00:00:00.000Z',
  'Missed',
  NULL,
  NULL,
  NULL,
  NULL,
  'Missed'
),
(
  (SELECT id FROM auth.users WHERE email = 'wayne@waynetturner.com'),
  '2025-08-02T00:00:00.000Z',
  'Missed',
  NULL,
  NULL,
  NULL,
  NULL,
  'Missed'
)
ON CONFLICT (user_id, workout_local_date_time, workout_type, exercise_name) 
DO NOTHING;

SELECT 
  workout_local_date_time::date as workout_date,
  workout_type,
  notes
FROM workout_exercises 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'wayne@waynetturner.com')
  AND workout_local_date_time::date IN ('2025-07-30', '2025-07-31', '2025-08-02')
ORDER BY workout_local_date_time;
