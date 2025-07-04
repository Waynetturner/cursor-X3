
-- Add missing RLS policies for security fixes (with proper handling of existing policies)

-- Enable RLS on all tables that don't have it yet
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ui_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  -- Profiles policies
  DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
  
  CREATE POLICY "Users can create their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

  CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

  CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

  -- Workouts policies
  DROP POLICY IF EXISTS "Users can view their own workouts" ON public.workouts;
  DROP POLICY IF EXISTS "Users can create their own workouts" ON public.workouts;
  DROP POLICY IF EXISTS "Users can update their own workouts" ON public.workouts;
  DROP POLICY IF EXISTS "Users can delete their own workouts" ON public.workouts;
  
  CREATE POLICY "Users can view their own workouts" 
  ON public.workouts 
  FOR SELECT 
  USING (auth.uid() = user_id);

  CREATE POLICY "Users can create their own workouts" 
  ON public.workouts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own workouts" 
  ON public.workouts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own workouts" 
  ON public.workouts 
  FOR DELETE 
  USING (auth.uid() = user_id);

  -- Exercises policies
  DROP POLICY IF EXISTS "Users can view their own exercises" ON public.exercises;
  DROP POLICY IF EXISTS "Users can create their own exercises" ON public.exercises;
  DROP POLICY IF EXISTS "Users can update their own exercises" ON public.exercises;
  DROP POLICY IF EXISTS "Users can delete their own exercises" ON public.exercises;
  
  CREATE POLICY "Users can view their own exercises" 
  ON public.exercises 
  FOR SELECT 
  USING (auth.uid() = user_id);

  CREATE POLICY "Users can create their own exercises" 
  ON public.exercises 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own exercises" 
  ON public.exercises 
  FOR UPDATE 
  USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own exercises" 
  ON public.exercises 
  FOR DELETE 
  USING (auth.uid() = user_id);

  -- User demographics policies
  DROP POLICY IF EXISTS "Users can view their own demographics" ON public.user_demographics;
  DROP POLICY IF EXISTS "Users can create their own demographics" ON public.user_demographics;
  DROP POLICY IF EXISTS "Users can update their own demographics" ON public.user_demographics;
  
  CREATE POLICY "Users can view their own demographics" 
  ON public.user_demographics 
  FOR SELECT 
  USING (auth.uid() = user_id);

  CREATE POLICY "Users can create their own demographics" 
  ON public.user_demographics 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own demographics" 
  ON public.user_demographics 
  FOR UPDATE 
  USING (auth.uid() = user_id);

  -- User UI settings policies
  DROP POLICY IF EXISTS "Users can view their own UI settings" ON public.user_ui_settings;
  DROP POLICY IF EXISTS "Users can create their own UI settings" ON public.user_ui_settings;
  DROP POLICY IF EXISTS "Users can update their own UI settings" ON public.user_ui_settings;
  
  CREATE POLICY "Users can view their own UI settings" 
  ON public.user_ui_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

  CREATE POLICY "Users can create their own UI settings" 
  ON public.user_ui_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own UI settings" 
  ON public.user_ui_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

  -- Coach conversations policies
  DROP POLICY IF EXISTS "Users can view their own conversations" ON public.coach_conversations;
  DROP POLICY IF EXISTS "Users can create their own conversations" ON public.coach_conversations;
  DROP POLICY IF EXISTS "Users can update their own conversations" ON public.coach_conversations;
  DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.coach_conversations;
  
  CREATE POLICY "Users can view their own conversations" 
  ON public.coach_conversations 
  FOR SELECT 
  USING (auth.uid() = user_id);

  CREATE POLICY "Users can create their own conversations" 
  ON public.coach_conversations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own conversations" 
  ON public.coach_conversations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own conversations" 
  ON public.coach_conversations 
  FOR DELETE 
  USING (auth.uid() = user_id);

  -- AI responses policies
  DROP POLICY IF EXISTS "Users can view their own AI responses" ON public.ai_responses;
  DROP POLICY IF EXISTS "Users can create their own AI responses" ON public.ai_responses;
  DROP POLICY IF EXISTS "Users can update their own AI responses" ON public.ai_responses;
  DROP POLICY IF EXISTS "Users can delete their own AI responses" ON public.ai_responses;
  
  CREATE POLICY "Users can view their own AI responses" 
  ON public.ai_responses 
  FOR SELECT 
  USING (auth.uid() = user_id);

  CREATE POLICY "Users can create their own AI responses" 
  ON public.ai_responses 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own AI responses" 
  ON public.ai_responses 
  FOR UPDATE 
  USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own AI responses" 
  ON public.ai_responses 
  FOR DELETE 
  USING (auth.uid() = user_id);
END $$;

-- Update the handle_new_user function to be more secure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$function$;

-- Create the trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
