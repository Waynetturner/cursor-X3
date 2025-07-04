
-- Update database functions to include SET search_path TO 'public' for security

-- Update get_user_demographics function
CREATE OR REPLACE FUNCTION public.get_user_demographics(p_user_id uuid)
 RETURNS TABLE(age integer, gender text, location text, fitness_level text, x3_program text, goals text, injury_history text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ud.age,
    ud.gender,
    ud.location,
    ud.fitness_level,
    ud.x3_program,
    ud.goals,
    ud.injury_history
  FROM public.user_demographics ud
  WHERE ud.user_id = p_user_id;
END;
$function$;

-- Update search_similar_queries function
CREATE OR REPLACE FUNCTION public.search_similar_queries(p_user_id uuid, p_query text, p_limit integer DEFAULT 5)
 RETURNS TABLE(id integer, query text, response text, source_type text, confidence_score numeric, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.query,
    ar.response,
    ar.source_type,
    ar.confidence_score,
    ar.created_at
  FROM public.ai_responses ar
  WHERE ar.user_id = p_user_id
    AND ar.query ILIKE '%' || p_query || '%'
  ORDER BY ar.created_at DESC
  LIMIT p_limit;
END;
$function$;

-- Update upsert_user_demographics function
CREATE OR REPLACE FUNCTION public.upsert_user_demographics(p_user_id uuid, p_age integer DEFAULT NULL::integer, p_gender text DEFAULT NULL::text, p_location text DEFAULT NULL::text, p_fitness_level text DEFAULT NULL::text, p_x3_program text DEFAULT NULL::text, p_goals text DEFAULT NULL::text, p_injury_history text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_demographics (
    user_id, age, gender, location, fitness_level, x3_program, goals, injury_history, updated_at
  )
  VALUES (
    p_user_id, p_age, p_gender, p_location, p_fitness_level, p_x3_program, p_goals, p_injury_history, now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    location = EXCLUDED.location,
    fitness_level = EXCLUDED.fitness_level,
    x3_program = EXCLUDED.x3_program,
    goals = EXCLUDED.goals,
    injury_history = EXCLUDED.injury_history,
    updated_at = now();
END;
$function$;
