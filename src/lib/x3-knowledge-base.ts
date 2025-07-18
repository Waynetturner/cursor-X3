// X3 Knowledge Base - Comprehensive X3 system information
export const X3_KNOWLEDGE_BASE = {
  // Core X3 Principles
  principles: {
    variableResistance: {
      concept: "Variable resistance provides optimal muscle loading throughout the full range of motion",
      benefits: [
        "Matches strength curve of muscles",
        "Maximizes muscle activation",
        "Reduces joint stress",
        "Enables heavier loading at strongest joint angles"
      ],
      application: "X3 bands provide 7x more resistance at full extension than at the bottom"
    },
    
    timeUnderTension: {
      concept: "Slower, controlled movements maximize muscle fiber recruitment",
      implementation: "4-second positive, 4-second negative repetitions",
      benefits: [
        "Greater muscle activation",
        "Improved muscle growth stimulus",
        "Enhanced strength gains",
        "Better mind-muscle connection"
      ]
    },
    
    trainToFailure: {
      philosophy: "Train to failure, not to a number",
      methodology: "Perform full range reps until failure, then continue with partial range reps",
      rationale: "Muscle growth occurs when forced to adapt beyond current capacity"
    },

    repRangeAndProgression: {
      targetRange: "15-40 repetitions per exercise",
      rules: {
        tooFew: "If you cannot complete 15 full range repetitions, move down to a lighter band (except White band - stay on White and build strength)",
        tooMany: "If you can complete more than 40 full range repetitions, move up to a heavier band",
        optimal: "Aim to reach failure between 15-40 reps, then continue with partial reps",
        failure: "After reaching failure in full range of motion, continue with partial range repetitions until complete muscular failure"
      },
      noSetsOrRest: "X3 is NOT traditional sets and reps - each exercise is performed once to complete failure, no rest periods between 'sets'"
    }
  },

  // Exercise Database
  exercises: {
    push: {
      chestPress: {
        name: "Chest Press",
        primaryMuscles: ["Pectoralis Major", "Anterior Deltoids", "Triceps"],
        setup: "Stand on band, handles at chest level, press forward and up",
        formCues: [
          "Keep core engaged throughout movement",
          "Press handles together at full extension",
          "Control the negative portion",
          "Maintain slight bend in knees"
        ],
        commonMistakes: [
          "Allowing handles to drift apart",
          "Rushing the negative",
          "Insufficient band tension at start"
        ],
        progressions: [
          "Start with lighter band for form mastery",
          "Progress to heavier bands as strength increases",
          "Focus on time under tension over rep count"
        ]
      },
      
      tricepPress: {
        name: "Tricep Press",
        primaryMuscles: ["Triceps", "Posterior Deltoids"],
        setup: "Stand on band, press handles overhead and back",
        formCues: [
          "Keep elbows close to head",
          "Full extension at top",
          "Control descent",
          "Engage core for stability"
        ],
        commonMistakes: [
          "Flaring elbows out too wide",
          "Incomplete range of motion",
          "Using shoulders instead of triceps"
        ],
        progressions: [
          "Start with lighter resistance",
          "Focus on elbow position",
          "Increase time under tension"
        ]
      },
      
      overheadPress: {
        name: "Overhead Press", 
        primaryMuscles: ["Deltoids", "Triceps", "Upper Chest"],
        setup: "Stand on band, press handles straight overhead",
        formCues: [
          "Drive through heels",
          "Keep core tight",
          "Press handles together overhead",
          "Maintain neutral spine"
        ],
        commonMistakes: [
          "Arching back excessively",
          "Pressing behind head",
          "Insufficient core engagement"
        ],
        progressions: [
          "Master bodyweight overhead reach first",
          "Progress band resistance gradually",
          "Focus on vertical pressing path"
        ]
      },
      
      frontSquat: {
        name: "Front Squat",
        primaryMuscles: ["Quadriceps", "Glutes", "Core"],
        setup: "Stand on band, handles at shoulder level, squat down",
        formCues: [
          "Keep chest up and core engaged",
          "Drive through heels",
          "Full depth squat",
          "Control the ascent"
        ],
        commonMistakes: [
          "Knees caving inward",
          "Forward lean",
          "Insufficient depth"
        ],
        progressions: [
          "Practice bodyweight squats first",
          "Add resistance gradually",
          "Focus on mobility and flexibility"
        ]
      }
    },

    pull: {
      bentOverRow: {
        name: "Bent Over Row",
        primaryMuscles: ["Latissimus Dorsi", "Rhomboids", "Rear Deltoids", "Biceps"],
        setup: "Stand on band, hinge at hips, pull handles to chest",
        formCues: [
          "Maintain flat back",
          "Pull elbows back and up",
          "Squeeze shoulder blades together",
          "Control the negative"
        ],
        commonMistakes: [
          "Rounding the back",
          "Using momentum to swing",
          "Not squeezing shoulder blades"
        ],
        progressions: [
          "Start with proper hip hinge movement",
          "Focus on back muscle activation",
          "Progress resistance gradually"
        ]
      },
      
      bicepCurl: {
        name: "Bicep Curl",
        primaryMuscles: ["Biceps", "Forearms"],
        setup: "Stand on band, curl handles to shoulders",
        formCues: [
          "Keep elbows at sides",
          "Full range of motion",
          "Control the negative",
          "Don't swing or use momentum"
        ],
        commonMistakes: [
          "Swinging the body",
          "Moving elbows forward",
          "Incomplete range of motion"
        ],
        progressions: [
          "Master the movement pattern first",
          "Focus on bicep isolation",
          "Increase resistance gradually"
        ]
      },
      
      calfRaise: {
        name: "Calf Raise",
        primaryMuscles: ["Gastrocnemius", "Soleus"],
        setup: "Stand on band, rise up on toes",
        formCues: [
          "Full extension at top",
          "Control the descent",
          "Keep body straight",
          "Focus on calf contraction"
        ],
        commonMistakes: [
          "Bouncing at the bottom",
          "Incomplete range of motion",
          "Using other muscles to assist"
        ],
        progressions: [
          "Practice bodyweight calf raises",
          "Add resistance gradually",
          "Focus on full range contraction"
        ]
      },
      
      deadlift: {
        name: "Deadlift",
        primaryMuscles: ["Hamstrings", "Glutes", "Lower Back", "Traps"],
        setup: "Stand on band, hinge at hips and pull up",
        formCues: [
          "Keep back straight",
          "Drive through heels",
          "Engage core throughout",
          "Full hip extension at top"
        ],
        commonMistakes: [
          "Rounding the back",
          "Knee-dominant movement",
          "Incomplete hip extension"
        ],
        progressions: [
          "Master hip hinge pattern",
          "Start with lighter resistance",
          "Focus on posterior chain activation"
        ]
      }
    }
  },

  // Band Information
  bands: {
    colors: ["White", "Light Gray", "Gray", "Dark Gray", "Black"],
    progression: {
      white: { resistance: "10-35 lbs", level: "Beginner", description: "Lightest resistance for form learning" },
      lightGray: { resistance: "25-60 lbs", level: "Beginner-Intermediate", description: "Light resistance for muscle activation" },
      gray: { resistance: "50-120 lbs", level: "Intermediate", description: "Moderate resistance for strength building" },
      darkGray: { resistance: "70-150 lbs", level: "Intermediate-Advanced", description: "Heavy resistance for strength gains" },
      black: { resistance: "100-300+ lbs", level: "Advanced", description: "Maximum resistance for elite strength" }
    },
    selection: {
      guidelines: [
        "Choose band that allows 15-40 full reps to failure",
        "Progress to heavier band when achieving 40+ full reps",
        "Form always takes priority over band color",
        "Different exercises may require different bands"
      ]
    }
  },

  // Program Structure
  program: {
    schedule: {
      weeks1to4: {
        pattern: "Push/Pull/Rest/Push/Pull/Rest/Rest",
        description: "Adaptation phase with extra recovery",
        focus: "Learning movement patterns and building base strength"
      },
      weeks5plus: {
        pattern: "Push/Pull/Push/Pull/Push/Pull/Rest", 
        description: "Intensification phase with increased frequency",
        focus: "Maximizing strength and muscle growth"
      }
    },
    
    progression: {
      weekly: "Increase resistance or reps based on performance",
      monthly: "Reassess band selection and exercise modifications",
      quarterly: "Evaluate overall progress and adjust program"
    },

    restDays: {
      importance: "Essential for muscle recovery and growth",
      activities: [
        "Light walking or stretching",
        "Focus on nutrition and hydration", 
        "Quality sleep for recovery",
        "Avoid intense physical activity"
      ]
    }
  },

  // Nutrition Guidelines (from Dr. Jaquish research)
  nutrition: {
    principles: [
      "Prioritize protein intake (1g per lb bodyweight minimum)",
      "Time protein around workouts for optimal recovery",
      "Focus on whole foods over processed options",
      "Hydration is crucial for performance and recovery"
    ],
    
    timing: {
      preWorkout: "Light protein 30-60 minutes before training",
      postWorkout: "Protein and carbohydrates within 30 minutes",
      daily: "Spread protein intake across 3-4 meals"
    }
  },

  // Common Questions & Troubleshooting
  faq: {
    plateaus: {
      question: "What if I stop progressing?",
      answers: [
        "Ensure you're truly training to failure",
        "Check form - quality over quantity",
        "Consider deload week with lighter resistance",
        "Evaluate recovery factors (sleep, nutrition, stress)"
      ]
    },
    
    soreness: {
      question: "How much muscle soreness is normal?",
      answers: [
        "Mild soreness 24-48 hours post-workout is normal",
        "Severe pain or inability to move is concerning",
        "Soreness should decrease as body adapts",
        "Focus on recovery if soreness persists beyond 72 hours"
      ]
    },
    
    frequency: {
      question: "Can I train more than the prescribed schedule?",
      answers: [
        "Recovery is when muscle growth occurs",
        "More is not always better",
        "Follow the program for optimal results",
        "Add light activity on rest days if desired"
      ]
    }
  }
}

// Coaching Prompts and Responses
export const COACHING_RESPONSES = {
  motivation: [
    "Remember, you're building strength that traditional weights can't match!",
    "Variable resistance is giving you 7x more muscle activation - feel that difference!",
    "Every rep to failure is a rep closer to your strength goals!",
    "The X3 system is designed for maximum efficiency - you're doing this right!",
    "Train to failure, not to a number - your body will thank you!"
  ],
  
  form: [
    "Focus on that 4-second negative - that's where the magic happens!",
    "Keep that tension throughout the full range of motion",
    "Remember to engage your core on every rep",
    "Quality over quantity - perfect form leads to perfect results",
    "Feel that variable resistance working harder as you extend!"
  ],
  
  progression: [
    "You're getting stronger! Consider moving up to the next band color",
    "Consistency is key - you're building momentum with every workout",
    "Your progressive overload is exactly what your muscles need",
    "Week by week, you're becoming a stronger version of yourself",
    "The X3 system is designed for continuous progression - trust the process!"
  ],
  
  recovery: [
    "Rest days are growth days - your muscles are getting stronger!",
    "Recovery is not optional - it's where the gains actually happen",
    "Use this time to focus on nutrition and hydration",
    "Light movement today will help you dominate tomorrow's workout",
    "Your body is adapting and growing stronger during this recovery period"
  ]
}

// Generate contextual coaching advice
export function generateCoachingAdvice(context: {
  currentExercise?: string
  week?: number
  workoutType?: 'Push' | 'Pull' | 'Rest'
  bandColor?: string
  reps?: number
  userQuestion?: string
}) {
  const { currentExercise, week, workoutType, bandColor, reps, userQuestion } = context
  
  // Exercise-specific advice
  if (currentExercise && X3_KNOWLEDGE_BASE.exercises.push[currentExercise as keyof typeof X3_KNOWLEDGE_BASE.exercises.push]) {
    const exercise = X3_KNOWLEDGE_BASE.exercises.push[currentExercise as keyof typeof X3_KNOWLEDGE_BASE.exercises.push]
    return {
      formCues: exercise.formCues,
      commonMistakes: exercise.commonMistakes,
      primaryMuscles: exercise.primaryMuscles
    }
  }
  
  // Week-specific guidance
  if (week && week <= 4) {
    return {
      focus: X3_KNOWLEDGE_BASE.program.schedule.weeks1to4.focus,
      advice: "You're in the adaptation phase - focus on learning proper form and building your foundation."
    }
  }
  
  // Band progression advice
  if (bandColor && reps && reps > 35) {
    return {
      progression: `With ${reps} reps on the ${bandColor} band, you're ready to progress to a heavier resistance!`,
      nextStep: "Consider moving to the next band color for optimal muscle challenge."
    }
  }
  
  return {
    general: "Focus on form, train to failure, and trust the X3 process for maximum results!"
  }
}
