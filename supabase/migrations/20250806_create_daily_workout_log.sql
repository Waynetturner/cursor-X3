-- Create daily_workout_log table for tracking scheduled and completed workouts
CREATE TABLE public.daily_workout_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    workout_type TEXT NOT NULL CHECK (workout_type IN ('Push', 'Pull', 'Rest', 'Missed')),
    status TEXT NOT NULL CHECK (status IN ('completed', 'scheduled')),
    week_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_daily_workout_log_user_id ON public.daily_workout_log(user_id);
CREATE INDEX idx_daily_workout_log_date ON public.daily_workout_log(date);
CREATE INDEX idx_daily_workout_log_user_date ON public.daily_workout_log(user_id, date);

-- Add unique constraint to prevent duplicate entries for the same user and date
CREATE UNIQUE INDEX idx_daily_workout_log_unique_user_date ON public.daily_workout_log(user_id, date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.daily_workout_log ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own workout logs
CREATE POLICY "Users can view own workout logs" ON public.daily_workout_log
    FOR ALL USING (auth.uid() = user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_daily_workout_log_updated_at BEFORE UPDATE ON public.daily_workout_log
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.daily_workout_log TO authenticated;
GRANT ALL ON public.daily_workout_log TO service_role;
