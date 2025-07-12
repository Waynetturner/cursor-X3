/**
 * TTS Phrase Library for X3 Momentum Pro
 * Comprehensive library of phrases for different subscription tiers and contexts
 */

export interface TTSPhrase {
  id: string
  text: string
  context: string
  tone: 'motivational' | 'instructional' | 'celebratory' | 'supportive'
  tier: 'momentum' | 'mastery' | 'both'
}

export interface PhraseCategory {
  exerciseStart: TTSPhrase[]
  exerciseTransition: TTSPhrase[]
  workoutCompletion: TTSPhrase[]
  encouragement: TTSPhrase[]
  formReminders: TTSPhrase[]
  progressCelebration: TTSPhrase[]
  restPeriod: TTSPhrase[]
  cadenceReminders: TTSPhrase[]
}

// Momentum Tier Phrases - Rule-based, pre-defined responses
const MOMENTUM_PHRASES: PhraseCategory = {
  exerciseStart: [
    {
      id: 'mom_start_1',
      text: 'Let\'s crush {exerciseName}! Focus on your form and controlled movement.',
      context: 'Starting any exercise',
      tone: 'motivational',
      tier: 'momentum'
    },
    {
      id: 'mom_start_2', 
      text: 'Time for {exerciseName}. Remember: two seconds out, two seconds back.',
      context: 'Starting exercise with cadence reminder',
      tone: 'instructional',
      tier: 'momentum'
    },
    {
      id: 'mom_start_3',
      text: 'You\'ve got this! {exerciseName} is up next. Stay focused on the tempo.',
      context: 'Encouraging start',
      tone: 'supportive',
      tier: 'momentum'
    },
    {
      id: 'mom_start_4',
      text: 'Ready to dominate {exerciseName}? Control the resistance, don\'t let it control you.',
      context: 'Motivational start with form cue',
      tone: 'motivational',
      tier: 'momentum'
    }
  ],

  exerciseTransition: [
    {
      id: 'mom_trans_1',
      text: '{exerciseName} complete! Take a breath and prepare for {nextExercise}.',
      context: 'Between exercises - standard',
      tone: 'supportive',
      tier: 'momentum'
    },
    {
      id: 'mom_trans_2',
      text: 'Great work on {exerciseName}. {nextExercise} is coming up - stay strong!',
      context: 'Encouraging transition',
      tone: 'motivational',
      tier: 'momentum'
    },
    {
      id: 'mom_trans_3',
      text: '{exerciseName} saved and recorded. Rest up and get ready for {nextExercise}.',
      context: 'Data confirmation + transition',
      tone: 'instructional',
      tier: 'momentum'
    },
    {
      id: 'mom_trans_4',
      text: 'Excellent {exerciseName}! Now gear up for {nextExercise} - you\'re doing amazing.',
      context: 'Celebratory transition',
      tone: 'celebratory',
      tier: 'momentum'
    }
  ],

  workoutCompletion: [
    {
      id: 'mom_complete_1',
      text: 'Outstanding! You\'ve completed your {workoutType} workout for today. Tomorrow will be a {nextWorkoutType} day.',
      context: 'Workout completion with preview',
      tone: 'celebratory',
      tier: 'momentum'
    },
    {
      id: 'mom_complete_2',
      text: 'Incredible work! That was a solid {workoutType} session. You\'re building momentum every day.',
      context: 'Motivational completion',
      tone: 'motivational',
      tier: 'momentum'
    },
    {
      id: 'mom_complete_3',
      text: 'Workout complete! You pushed through every exercise with great form. Rest proud.',
      context: 'Form-focused completion',
      tone: 'supportive',
      tier: 'momentum'
    },
    {
      id: 'mom_complete_4',
      text: 'Yes! Another {workoutType} workout in the books. Your consistency is paying off.',
      context: 'Consistency-focused completion',
      tone: 'celebratory',
      tier: 'momentum'
    }
  ],

  encouragement: [
    {
      id: 'mom_enc_1',
      text: 'Keep pushing! You\'re stronger than you think.',
      context: 'General encouragement during exercise',
      tone: 'motivational',
      tier: 'momentum'
    },
    {
      id: 'mom_enc_2',
      text: 'Stay focused on your breathing and form.',
      context: 'Form reminder during exercise',
      tone: 'instructional',
      tier: 'momentum'
    },
    {
      id: 'mom_enc_3',
      text: 'You\'re doing great! Maintain that control.',
      context: 'Positive reinforcement',
      tone: 'supportive',
      tier: 'momentum'
    },
    {
      id: 'mom_enc_4',
      text: 'This is where strength is built - in the challenge.',
      context: 'Motivational reminder',
      tone: 'motivational',
      tier: 'momentum'
    }
  ],

  formReminders: [
    {
      id: 'mom_form_1',
      text: 'Focus on your tempo. Two seconds out, two seconds back.',
      context: 'Cadence reminder',
      tone: 'instructional',
      tier: 'momentum'
    },
    {
      id: 'mom_form_2',
      text: 'Control the movement. Don\'t let the band snap back.',
      context: 'Control reminder',
      tone: 'instructional',
      tier: 'momentum'
    },
    {
      id: 'mom_form_3',
      text: 'Keep your core engaged and maintain proper posture.',
      context: 'Posture reminder',
      tone: 'instructional',
      tier: 'momentum'
    },
    {
      id: 'mom_form_4',
      text: 'Focus on the full range of motion for maximum benefit.',
      context: 'Range of motion reminder',
      tone: 'instructional',
      tier: 'momentum'
    }
  ],

  progressCelebration: [
    {
      id: 'mom_prog_1',
      text: 'Personal best! You\'re getting stronger every workout.',
      context: 'New personal record',
      tone: 'celebratory',
      tier: 'momentum'
    },
    {
      id: 'mom_prog_2',
      text: 'Look at that progress! Your hard work is showing.',
      context: 'General progress recognition',
      tone: 'celebratory',
      tier: 'momentum'
    },
    {
      id: 'mom_prog_3',
      text: 'Improvement noted! Keep this momentum going.',
      context: 'Incremental progress',
      tone: 'motivational',
      tier: 'momentum'
    },
    {
      id: 'mom_prog_4',
      text: 'That\'s the X3 difference! Your strength is building fast.',
      context: 'X3-specific progress',
      tone: 'celebratory',
      tier: 'momentum'
    }
  ],

  restPeriod: [
    {
      id: 'mom_rest_1',
      text: 'Rest timer started. Take deep breaths and prepare for what\'s next.',
      context: 'Rest timer start',
      tone: 'instructional',
      tier: 'momentum'
    },
    {
      id: 'mom_rest_2',
      text: 'Ninety seconds of recovery. Use this time to visualize your next set.',
      context: 'Rest period guidance',
      tone: 'instructional',
      tier: 'momentum'
    },
    {
      id: 'mom_rest_3',
      text: 'Rest period complete. Time to get back to work!',
      context: 'Rest timer completion',
      tone: 'motivational',
      tier: 'momentum'
    },
    {
      id: 'mom_rest_4',
      text: 'Recovery time is over. Let\'s maintain that intensity!',
      context: 'Return to exercise',
      tone: 'motivational',
      tier: 'momentum'
    }
  ],

  cadenceReminders: [
    {
      id: 'mom_cad_1',
      text: 'Cadence started. Two second intervals for proper form.',
      context: 'Cadence timer start',
      tone: 'instructional',
      tier: 'momentum'
    },
    {
      id: 'mom_cad_2',
      text: 'Follow the tempo. Control every rep.',
      context: 'During cadence',
      tone: 'instructional',
      tier: 'momentum'
    },
    {
      id: 'mom_cad_3',
      text: 'Perfect timing! Stay with that rhythm.',
      context: 'Cadence reinforcement',
      tone: 'supportive',
      tier: 'momentum'
    },
    {
      id: 'mom_cad_4',
      text: 'That\'s the X3 tempo. Maximum muscle engagement.',
      context: 'X3-specific cadence praise',
      tone: 'instructional',
      tier: 'momentum'
    }
  ]
}

// Mastery Tier Phrases - Enhanced with more personalization options
const MASTERY_PHRASES: PhraseCategory = {
  exerciseStart: [
    {
      id: 'mas_start_1',
      text: 'Let\'s optimize your {exerciseName} performance. Focus on mind-muscle connection.',
      context: 'Advanced exercise start',
      tone: 'instructional',
      tier: 'mastery'
    },
    {
      id: 'mas_start_2',
      text: 'Time to master {exerciseName}. Your form has been improving - keep that precision.',
      context: 'Progress-aware start',
      tone: 'supportive',
      tier: 'mastery'
    },
    {
      id: 'mas_start_3',
      text: 'Advanced technique time! {exerciseName} with perfect biomechanics.',
      context: 'Technique-focused start',
      tone: 'instructional',
      tier: 'mastery'
    }
  ],

  exerciseTransition: [
    {
      id: 'mas_trans_1',
      text: '{exerciseName} executed with precision. {nextExercise} is next - maintain that excellence.',
      context: 'Quality-focused transition',
      tone: 'supportive',
      tier: 'mastery'
    },
    {
      id: 'mas_trans_2',
      text: 'Flawless {exerciseName}! Your technique is dialed in. Ready for {nextExercise}?',
      context: 'Technique praise transition',
      tone: 'celebratory',
      tier: 'mastery'
    }
  ],

  workoutCompletion: [
    {
      id: 'mas_complete_1',
      text: 'Mastery level performance! Your {workoutType} workout showed exceptional form and intensity.',
      context: 'High-level completion praise',
      tone: 'celebratory',
      tier: 'mastery'
    },
    {
      id: 'mas_complete_2',
      text: 'Elite session complete! Your consistency and technique are setting new standards.',
      context: 'Elite performance recognition',
      tone: 'celebratory',
      tier: 'mastery'
    }
  ],

  encouragement: [
    {
      id: 'mas_enc_1',
      text: 'Channel that intensity! Your mental focus is creating physical transformation.',
      context: 'Mind-body connection encouragement',
      tone: 'motivational',
      tier: 'mastery'
    },
    {
      id: 'mas_enc_2',
      text: 'This is where champions are forged. Embrace the challenge.',
      context: 'Elite mindset encouragement',
      tone: 'motivational',
      tier: 'mastery'
    }
  ],

  formReminders: [
    {
      id: 'mas_form_1',
      text: 'Optimize your neural drive. Feel every muscle fiber engaging.',
      context: 'Advanced neuromuscular cue',
      tone: 'instructional',
      tier: 'mastery'
    },
    {
      id: 'mas_form_2',
      text: 'Perfect biomechanics create perfect results. Stay technical.',
      context: 'Biomechanics focus',
      tone: 'instructional',
      tier: 'mastery'
    }
  ],

  progressCelebration: [
    {
      id: 'mas_prog_1',
      text: 'Peak performance achieved! Your training intelligence is exceptional.',
      context: 'Elite performance celebration',
      tone: 'celebratory',
      tier: 'mastery'
    },
    {
      id: 'mas_prog_2',
      text: 'Breakthrough moment! This is what mastery looks like.',
      context: 'Breakthrough achievement',
      tone: 'celebratory',
      tier: 'mastery'
    }
  ],

  restPeriod: [
    {
      id: 'mas_rest_1',
      text: 'Strategic recovery initiated. Visualize your next performance while you rest.',
      context: 'Advanced rest guidance',
      tone: 'instructional',
      tier: 'mastery'
    },
    {
      id: 'mas_rest_2',
      text: 'Recovery optimization in progress. Your body is adapting to elite demands.',
      context: 'Recovery science',
      tone: 'instructional',
      tier: 'mastery'
    }
  ],

  cadenceReminders: [
    {
      id: 'mas_cad_1',
      text: 'Precision timing activated. Each rep is a masterpiece.',
      context: 'Elite cadence start',
      tone: 'instructional',
      tier: 'mastery'
    },
    {
      id: 'mas_cad_2',
      text: 'Optimal tempo achieved. This is peak biomechanical efficiency.',
      context: 'Advanced cadence praise',
      tone: 'supportive',
      tier: 'mastery'
    }
  ]
}

// Phrase selection utilities
export class TTSPhraseService {
  private momentumPhrases = MOMENTUM_PHRASES
  private masteryPhrases = MASTERY_PHRASES
  private usedPhrases: Set<string> = new Set()

  /**
   * Get a random phrase for a specific context and tier
   */
  getPhrase(
    category: keyof PhraseCategory,
    tier: 'momentum' | 'mastery',
    context?: { [key: string]: string }
  ): string {
    const phrases = tier === 'mastery' 
      ? [...this.masteryPhrases[category], ...this.momentumPhrases[category].filter(p => p.tier === 'both')]
      : this.momentumPhrases[category]

    // Filter out recently used phrases to avoid repetition
    const availablePhrases = phrases.filter(phrase => !this.usedPhrases.has(phrase.id))
    
    // If all phrases have been used, reset the used set
    if (availablePhrases.length === 0) {
      this.usedPhrases.clear()
      return this.getPhrase(category, tier, context)
    }

    // Select random phrase
    const selectedPhrase = availablePhrases[Math.floor(Math.random() * availablePhrases.length)]
    this.usedPhrases.add(selectedPhrase.id)

    // Replace context variables
    let finalText = selectedPhrase.text
    if (context) {
      Object.keys(context).forEach(key => {
        const placeholder = `{${key}}`
        finalText = finalText.replace(new RegExp(placeholder, 'g'), context[key])
      })
    }

    return finalText
  }

  /**
   * Get exercise start phrase
   */
  getExerciseStartPhrase(exerciseName: string, tier: 'momentum' | 'mastery'): string {
    return this.getPhrase('exerciseStart', tier, { exerciseName })
  }

  /**
   * Get exercise transition phrase
   */
  getExerciseTransitionPhrase(
    exerciseName: string, 
    nextExercise: string, 
    tier: 'momentum' | 'mastery'
  ): string {
    return this.getPhrase('exerciseTransition', tier, { exerciseName, nextExercise })
  }

  /**
   * Get workout completion phrase
   */
  getWorkoutCompletionPhrase(
    workoutType: string, 
    nextWorkoutType: string, 
    tier: 'momentum' | 'mastery'
  ): string {
    return this.getPhrase('workoutCompletion', tier, { workoutType, nextWorkoutType })
  }

  /**
   * Get cadence reminder phrase
   */
  getCadencePhrase(tier: 'momentum' | 'mastery'): string {
    return this.getPhrase('cadenceReminders', tier)
  }

  /**
   * Get rest period phrase
   */
  getRestPhrase(tier: 'momentum' | 'mastery'): string {
    return this.getPhrase('restPeriod', tier)
  }

  /**
   * Get encouragement phrase
   */
  getEncouragementPhrase(tier: 'momentum' | 'mastery'): string {
    return this.getPhrase('encouragement', tier)
  }

  /**
   * Get form reminder phrase
   */
  getFormReminderPhrase(tier: 'momentum' | 'mastery'): string {
    return this.getPhrase('formReminders', tier)
  }

  /**
   * Get progress celebration phrase
   */
  getProgressPhrase(tier: 'momentum' | 'mastery'): string {
    return this.getPhrase('progressCelebration', tier)
  }

  /**
   * Reset used phrases to allow repetition
   */
  resetUsedPhrases(): void {
    this.usedPhrases.clear()
  }

  /**
   * Get phrase statistics
   */
  getStats() {
    return {
      totalMomentumPhrases: Object.values(this.momentumPhrases).reduce((sum, arr) => sum + arr.length, 0),
      totalMasteryPhrases: Object.values(this.masteryPhrases).reduce((sum, arr) => sum + arr.length, 0),
      usedPhrasesCount: this.usedPhrases.size
    }
  }
}

// Singleton instance
export const ttsPhaseService = new TTSPhraseService()

// Export phrase categories for direct access if needed
export { MOMENTUM_PHRASES, MASTERY_PHRASES }