-- Instructions to run this migration:
-- 1. Open Supabase Dashboard -> SQL Editor
-- 2. Copy and paste the content of migrations/001_add_tts_columns_to_user_ui_settings.sql
-- 3. Execute the SQL

-- Alternative: If you have Supabase CLI installed, run:
-- supabase db reset (this will apply all migrations)
-- or
-- supabase db push (to push the migration)

-- Quick verification query to check if columns exist:
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_ui_settings' 
ORDER BY ordinal_position;