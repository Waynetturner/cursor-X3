
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function saveCoachResponse(
  userId: string, 
  userMessage: string, 
  coachResponse: string,
  metadata?: any
): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error: insertError } = await supabase
    .from('coach_conversations')
    .insert({
      user_id: userId,
      user_message: userMessage,
      coach_response: coachResponse,
      model_used: metadata?.model || 'openai',
      tokens_used: metadata?.tokens || null
    });

  if (insertError) {
    console.error('Error saving coach conversation:', insertError);
    // Don't throw here, still return the response to user
  } else {
    console.log('Coach conversation saved successfully');
  }
}
