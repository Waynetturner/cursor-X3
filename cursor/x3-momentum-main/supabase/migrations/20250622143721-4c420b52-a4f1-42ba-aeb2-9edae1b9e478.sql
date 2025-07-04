
-- Add first_name and last_name columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Update existing records by splitting full_name
UPDATE public.profiles 
SET 
  first_name = CASE 
    WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 
    THEN split_part(full_name, ' ', 1)
    ELSE full_name
  END,
  last_name = CASE 
    WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 
    THEN substring(full_name from position(' ' in full_name) + 1)
    ELSE NULL
  END
WHERE full_name IS NOT NULL;

-- Update the handle_new_user function to use first_name and last_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, full_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(
      TRIM(CONCAT(
        COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''), 
        ' ', 
        COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
      )),
      NEW.raw_user_meta_data ->> 'full_name'
    )
  );
  RETURN NEW;
END;
$function$;
