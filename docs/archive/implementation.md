## AI Integration Architecture

### Tier 2: Static Intelligence Coaching (No AI APIs)
```typescript
// lib/coaching/staticCoach.ts

interface WorkoutAnalysis {
  messageType: 'band_progression' | 'improvement' | 'encouragement' | 'consistency' | 'plateau_warning';
  message: string;
  ttsMessage: string;
  celebrationType?: 'personal_best' | 'streak' | 'milestone';
}

export class StaticIntelligenceCoach {
  // Pre-written message banks organized by category
  private messageBanks = {
    band_progression: [
      {
        message: "Outstanding! 40+ reps means you're ready for the next band!",
        tts: "Outstanding! You hit over 40 reps. Time to advance to the next resistance band!"
      },
      {
        message: "Incredible strength gains! Time to advance to a heavier band.",
        tts: "Incredible progress! Your strength has grown - let's move to a heavier band."
      },
      // ... more pre-written variations
    ],
    improvement: [
      {
        message: "Great job! You improved from last time - keep building!",
        tts: "Great improvement from your last workout! Keep building that momentum."
      },
      // ... more variations
    ],
    encouragement: [
      {
        message: "Every rep counts! Consistency beats perfection.",
        tts: "Remember, every rep counts. Your consistency is what builds real strength."
      },
      // ... more variations
    ],
    plateau_warning: [
      {
        message: "Try focusing on slower, controlled reps to break through this plateau.",
        tts: "Consider slowing down your reps for better muscle tension and growth."
      },
      // ... more variations
    ]
  };

  analyzeWorkout(exerciseData: WorkoutExercise[], progressHistory: WorkoutExercise[]): WorkoutAnalysis {
    const currentExercise = exerciseData[0]; // Current exercise being analyzed
    const totalReps = currentExercise.full_reps + currentExercise.partial_reps;
    
    // Get previous workouts for this exercise
    const previousWorkouts = progressHistory
      .filter(w => w.exercise_name === currentExercise.exercise_name)
      .sort((a, b) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime())
      .slice(0, 5);

    // Rule-based analysis
    if (totalReps >= 40) {
      return this.getRandomMessage('band_progression');
    }
    
    if (previousWorkouts.length > 0) {
      const lastTotal = previousWorkouts[0].full_reps + previousWorkouts[0].partial_reps;
      if (totalReps > lastTotal) {
        return this.getRandomMessage('improvement');
      }
      
      // Plateau detection: same reps for 3+ workouts
      if (previousWorkouts.length >= 3) {
        const recentTotals = previousWorkouts.slice(0, 3).map(w => w.full_reps + w.partial_reps);
        const isPlateaued = recentTotals.every(total => Math.abs(total - totalReps) <= 2);
        if (isPlateaued) {
          return this.getRandomMessage('plateau_warning');
        }
      }
    }
    
    if (totalReps < 15) {
      return this.getRandomMessage('encouragement');
    }
    
    return this.getRandomMessage('consistency');
  }

  private getRandomMessage(type: string): WorkoutAnalysis {
    const messages = this.messageBanks[type];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    return {
      messageType: type as any,
      message: randomMessage.message,
      ttsMessage: randomMessage.tts
    };
  }

  // 90-second rest timer with scripted encouragement
  generateRestTimerMessage(exerciseName: string, nextExercise: string): string {
    return `${exerciseName} saved and recorded. Catch your breath and get set up for ${nextExercise}`;
  }

  // Final exercise variations
  generateFinalExerciseMessage(): string {
    const messages = [
      "Great job! How are you doing?",
      "Excellent work! Tell me about your energy level",
      "Outstanding effort! How did that feel?",
      "Fantastic session! What's your energy like?",
      "Well done! How are you feeling after that workout?"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
}
```

### Tier 3: Dynamic AI Coaching (OpenAI/Claude APIs)
```typescript
// lib/coaching/dynamicAICoach.ts

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface AICoachingResponse {
  message: string;
  ttsMessage: string;
  tone: 'supportive' | 'motivational' | 'educational' | 'celebratory';
  confidence: number;
  suggestions?: string[];
}

export class DynamicAICoach {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
    });
  }

  async generatePersonalizedResponse(
    userFeedback: string,
    workoutData: WorkoutExercise[],
    progressHistory: WorkoutExercise[],
    userProfile: Profile
  ): Promise<AICoachingResponse> {
    const context = this.buildContext(userFeedback, workoutData, progressHistory, userProfile);
    
    // Use Claude for conversational coaching
    const prompt = `You are an expert X3 resistance band trainer and motivational coach. 

User Context:
- Fitness Level: ${userProfile.fitness_level}
- Current Week: ${this.getCurrentWeek(userProfile.x3_start_date)}
- Today's Feedback: "${userFeedback}"

Workout Performance:
${workoutData.map(ex => 
  `${ex.exercise_name}: ${ex.full_reps}+${ex.partial_reps} reps (${ex.band_color} band)`
).join('\n')}

Recent Progress:
${this.summarizeProgress(progressHistory)}

Guidelines:
- Keep response under 60 words
- Be encouraging and specific to their feedback
- Reference their actual performance numbers when relevant
- Acknowledge the mental challenge of "training to failure"
- Provide actionable advice when appropriate
- Match energy level to their feedback tone

Respond with JSON:
{
  "message": "your coaching response",
  "ttsMessage": "slightly shorter version for text-to-speech",
  "tone": "supportive|motivational|educational|celebratory",
  "confidence": 0.8,
  "suggestions": ["optional", "actionable", "tips"]
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      });

      const parsed = JSON.parse(response.content[0].text);
      return {
        message: parsed.message,
        ttsMessage: parsed.ttsMessage || parsed.message,
        tone: parsed.tone,
        confidence: parsed.confidence,
        suggestions: parsed.suggestions
      };
    } catch (error) {
      console.error('AI Coaching Error:', error);
      // Fallback to static coaching
      return this.fallbackToStatic(userFeedback, workoutData);
    }
  }

  // OpenAI for structured workout analysis
  async analyzeWorkoutPerformance(
    workoutData: WorkoutExercise[],
    progressHistory: WorkoutExercise[]
  ): Promise<{
    overall_performance: 'excellent' | 'good' | 'average' | 'needs_improvement';
    progression_insights: string[];
    recommendations: string[];
    plateau_warning: boolean;
  }> {
    const prompt = `Analyze this X3 workout performance:

Today's Workout:
${JSON.stringify(workoutData, null, 2)}

Progress History (last 10 workouts):
${JSON.stringify(progressHistory.slice(0, 10), null, 2)}

Provide analysis in this exact JSON format:
{
  "overall_performance": "excellent|good|average|needs_improvement",
  "progression_insights": ["insight1", "insight2"],
  "recommendations": ["rec1", "rec2"],
  "plateau_warning": true|false
}

Focus on X3-specific metrics: band progression (40+ reps = advance), training to failure effectiveness, rep consistency.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 400
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Performance Analysis Error:', error);
      return {
        overall_performance: 'good',
        progression_insights: ['Analysis temporarily unavailable'],
        recommendations: ['Continue with your current approach'],
        plateau_warning: false
      };
    }
  }

  private buildContext(userFeedback: string, workoutData: WorkoutExercise[], progressHistory: WorkoutExercise[], userProfile: Profile): string {
    // Build rich context for AI analysis
    return `
    User has been training for ${this.getDaysSinceStart(userProfile.x3_start_date)} days.
    Current workout type: ${workoutData[0]?.workout_type}
    Feedback sentiment: ${this.analyzeSentiment(userFeedback)}
    Recent performance trend: ${this.getPerformanceTrend(progressHistory)}
    `;
  }

  private fallbackToStatic(userFeedback: string, workoutData: WorkoutExercise[]): AICoachingResponse {
    // Fallback to static coaching if AI fails
    const staticCoach = new StaticIntelligenceCoach();
    const analysis = staticCoach.analyzeWorkout(workoutData, []);
    
    return {
      message: analysis.message,
      ttsMessage: analysis.ttsMessage,
      tone: 'supportive',
      confidence: 0.6
    };
  }

  // Helper methods...
  private getCurrentWeek(startDate: string): number {
    const start = new Date(startDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(daysDiff / 7) + 1;
  }

  private getDaysSinceStart(startDate: string): number {
    const start = new Date(startDate);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private analyzeSentiment(feedback: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['good', 'great', 'strong', 'easy', 'better', 'improved'];
    const negativeWords = ['tired', 'weak', 'struggled', 'difficult', 'sore', 'hard'];
    
    const lowerFeedback = feedback.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerFeedback.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerFeedback.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private summarizeProgress(history: WorkoutExercise[]): string {
    if (history.length === 0) return 'No previous workouts';
    
    // Summarize recent performance trends
    const recentWorkouts = history.slice(0, 5);
    const avgReps = recentWorkouts.reduce((sum, w) => sum + w.full_reps + w.partial_reps, 0) / recentWorkouts.length;
    return `Recent average: ${Math.round(avgReps)} reps across ${recentWorkouts.length} workouts`;
  }

  private getPerformanceTrend(history: WorkoutExercise[]): 'improving' | 'stable' | 'declining' {
    if (history.length < 3) return 'stable';
    
    const recent = history.slice(0, 3).map(w => w.full_reps + w.partial_reps);
    const trend = recent[0] - recent[2]; // Compare latest to 3 workouts ago
    
    if (trend > 2) return 'improving';
    if (trend < -2) return 'declining';
    return 'stable';
  }
}
```

### Integration Pattern
```typescript
// lib/coaching/coachingService.ts

export class CoachingService {
  private staticCoach: StaticIntelligenceCoach;
  private dynamicCoach: DynamicAICoach;

  constructor(private userTier: 'foundation' | 'momentum' | 'mastery') {
    this.staticCoach = new StaticIntelligenceCoach();
    if (userTier === 'mastery') {
      this.dynamicCoach = new DynamicAICoach();
    }
  }

  async generateCoachingResponse(
    userFeedback: string,
    workoutData: WorkoutExercise[],
    progressHistory: WorkoutExercise[],
    userProfile: Profile
  ): Promise<AICoachingResponse | WorkoutAnalysis> {
    
    // Route to appropriate coaching system based on tier
    switch (this.userTier) {
      case 'foundation':
        return { message: '', ttsMessage: '', messageType: 'consistency' }; // No coaching
        
      case 'momentum':
        // Static intelligence coaching
        return this.staticCoach.analyzeWorkout(workoutData, progressHistory);
        
      case 'mastery':
        // Dynamic AI coaching with fallback
        try {
          return await this.dynamicCoach.generatePersonalizedResponse(
            userFeedback, workoutData, progressHistory, userProfile
          );
        } catch (error) {
          // Graceful degradation to static coaching
          console.warn('AI coaching failed, falling back to static coaching');
          return this.staticCoach.analyzeWorkout(workoutData, progressHistory);
        }
        
      default:
        return this.staticCoach.analyzeWorkout(workoutData, progressHistory);
    }
  }
}
```