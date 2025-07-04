
import { X3_SYSTEM_PROMPT, WORKOUT_ANALYSIS_PROMPT, GENERAL_COACHING_PROMPT } from './constants.ts';

export function buildSystemPrompt(
  personalizedContext: string,
  similarQueriesContext: string,
  isWorkoutAnalysis: boolean
): string {
  let systemPrompt = X3_SYSTEM_PROMPT + personalizedContext + similarQueriesContext;

  if (isWorkoutAnalysis) {
    systemPrompt += WORKOUT_ANALYSIS_PROMPT;
  } else {
    systemPrompt += GENERAL_COACHING_PROMPT;
  }

  return systemPrompt;
}
