# Settings Page Database Integration Fix

## Issue Summary
The X3 Tracker settings page was unable to save user profile data due to database schema and integration issues.

## Problems Identified
1. **Missing Migration File**: `005_ensure_settings_compatibility.sql` was referenced but didn't exist
2. **RLS Policy Errors**: UUID type mismatch in Row Level Security policies 
3. **Upsert Conflicts**: Duplicate key constraint violations when trying to save existing user data
4. **Poor Error Logging**: Empty error objects `{}` made debugging difficult

## Solutions Implemented

### 1. Database Schema Migration
**File**: Manual SQL execution in Supabase Dashboard

```sql
-- Migration to ensure database compatibility with updated settings page
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS x3_start_date DATE,
ADD COLUMN IF NOT EXISTS timezone TEXT;

CREATE TABLE IF NOT EXISTS user_demographics (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
    goals TEXT,
    available_equipment TEXT,
    session_length TEXT,
    coach_tone TEXT CHECK (coach_tone IN ('motivational', 'technical', 'balanced', 'minimal')),
    injury_history TEXT,
    language TEXT DEFAULT 'en',
    timezone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

ALTER TABLE user_demographics ENABLE ROW LEVEL SECURITY;

-- Fixed RLS policies with proper UUID casting
CREATE POLICY "Users can view own demographics" ON user_demographics 
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own demographics" ON user_demographics 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own demographics" ON user_demographics 
    FOR UPDATE USING (auth.uid()::text = user_id::text);

GRANT ALL ON user_demographics TO authenticated;
GRANT ALL ON user_demographics TO service_role;
```

### 2. Code Fix in settings/page.tsx
**File**: `src/app/settings/page.tsx`

**Problem**: Upsert operation failed with duplicate key constraint
```typescript
// BEFORE - Failed with constraint violation
const { error: demoError } = await supabase
  .from('user_demographics')
  .upsert({
    user_id: user.id,
    // ... other fields
  });
```

**Solution**: Added conflict resolution
```typescript
// AFTER - Properly handles existing records
const { error: demoError } = await supabase
  .from('user_demographics')
  .upsert({
    user_id: user.id,
    // ... other fields
  }, { onConflict: 'user_id' });
```

### 3. Error Logging Improvements
Enhanced error logging for debugging (later cleaned up for production):
```typescript
if (demoError) {
  console.error('Demographics table error:', demoError);
  throw demoError;
}
```

## Results
✅ **Profile saving now works correctly**  
✅ **Data persists in both `profiles` and `user_demographics` tables**  
✅ **Success feedback displays to users**  
✅ **No more console errors**  
✅ **Data loads properly on page refresh**  

## Error Code Reference
- **Error 23505**: `duplicate key value violates unique constraint` - Fixed with `onConflict` parameter
- **Error 42883**: `operator does not exist: uuid = text` - Fixed with type casting `::text`

## Files Modified
1. `src/app/settings/page.tsx` - Added `onConflict` parameter to upsert operation
2. Supabase Database - Executed migration SQL manually

## Testing Steps
1. Navigate to `/settings`
2. Fill in profile information (name, fitness experience, start date)
3. Click "Save Profile Changes"
4. Verify green success message appears
5. Refresh page and confirm data loads correctly
6. Check Supabase Dashboard tables for saved data

## Date: July 19, 2025
## Status: ✅ RESOLVED
