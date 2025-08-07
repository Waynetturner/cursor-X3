# Daily Workout Log Migration Guide

This guide explains how to apply the daily_workout_log table migration and backfill historical data.

## Step 1: Apply Database Migration

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20250806_create_daily_workout_log.sql`
4. Paste and execute in the SQL Editor

## Step 2: Backfill Historical Data

After the table is created, you need to backfill your historical workout data.

### Run the Backfill Script

1. Find your user ID in Supabase Auth > Users
2. Set environment variables:
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. Run the backfill script:
   ```bash
   npx tsx src/lib/backfill-daily-workout-log.ts YOUR_USER_ID
   ```

This will:
1. Process all your workout history from your start date
2. Create daily entries for Push/Pull/Rest/Missed days
3. Apply the special handling for pre-7/30 data (marking as Rest instead of Missed)
4. Generate the correct schedule going forward

## Step 3: Verify the Migration

Check the following dates in your daily_workout_log table:

- **7/30/2025** - Should show as "Missed" (your first missed day)
- **8/3/2025** - Should show as "Pull" (completed)
- **8/5/2025** - Should show as "Push" (completed)
- **8/6/2025** - Should show what's scheduled for today

## Step 4: Update Application Code

The application will be updated to:
1. Read from daily_workout_log for Calendar and Dashboard
2. Continue writing to workout_exercises for exercise performance
3. Also update daily_workout_log when workouts are saved

## Expected Results

After this migration:
- Calendar will show accurate workout history
- Dashboard will show the correct workout for today
- Both will use the same data source (daily_workout_log)
- Stats will have accurate streak calculations

## Troubleshooting

If you see any issues:

1. Check that the daily_workout_log table was created successfully
2. Verify your user ID is correct
3. Check the console output from the backfill script
4. Look for the sample entries logged at the end of the backfill

## Step 4: Clean Up Temporary Files

After successful migration and verification, remove the temporary migration files:

```bash
rm src/lib/backfill-daily-workout-log.ts
rm src/lib/daily-workout-log.ts
rm -rf supabase/migrations
rm docs/DAILY_WORKOUT_LOG_*.md
```

## Next Steps

Once the migration is complete and verified:
1. The Calendar page will be updated to use daily_workout_log
2. The Dashboard will be updated to use daily_workout_log
3. The workout save function will write to both tables
4. Stats calculations will use the new accurate data

## Important Note

The backfill script and migration files are temporary tools to fix the data in Supabase. Once the migration is complete and verified, these files should be removed from the project as they are no longer needed.
