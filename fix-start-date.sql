
SELECT id, x3_start_date, created_at 
FROM profiles 
WHERE x3_start_date IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

UPDATE profiles 
SET x3_start_date = '2025-05-28'
WHERE x3_start_date = '2025-05-29';

SELECT id, x3_start_date, created_at 
FROM profiles 
WHERE x3_start_date = '2025-05-28'
ORDER BY created_at DESC;
