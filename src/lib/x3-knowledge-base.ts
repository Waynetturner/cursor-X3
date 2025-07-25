// X3 Knowledge Base - Comprehensive X3 system information (CORRECTED VERSION)
// Based on official "Weight Lifting Is a Waste of Time" by Dr. John Jaquish
export const X3_KNOWLEDGE_BASE = {
  // Core X3 Principles - CORRECTED
  principles: {
    variableResistance: {
      concept: "Variable resistance provides optimal muscle loading throughout the full range of motion",
      benefits: [
        "Matches strength curve of muscles",
        "Maximizes muscle activation (7x more than traditional weights)",
        "Reduces joint stress at weakest points",
        "Enables heavier loading at strongest joint angles",
        "Triggers superior hormonal responses (growth hormone, testosterone)"
      ],
      application: "X3 bands provide variable resistance that increases as muscles reach their strongest point"
    },
    
    timeUnderTension: {
      concept: "Controlled movements maximize muscle fiber recruitment and hormonal response",
      implementation: "2 seconds up (positive), 2 seconds down (negative) - NOT 4 seconds",
      benefits: [
        "Greater muscle activation than traditional weights",
        "Enhanced hormonal response",
        "Improved strength gains",
        "Better mind-muscle connection",
        "Optimal time under tension for growth"
      ]
    },
    
    trainToFailure: {
      philosophy: "Train to failure, not to a number - this is the core X3 principle",
      methodology: "Perform full range reps until failure, then continue with partial range reps until complete muscular failure",
      rationale: "Muscle growth occurs when forced to adapt beyond current capacity",
      noSets: "X3 is NOT traditional sets and reps - each exercise is performed ONCE to complete failure"
    },

    repRangeAndProgression: {
      targetRange: "15-40 repetitions per exercise (full range of motion)",
      rules: {
        tooFew: "If you cannot complete 15 full range repetitions, move down to a lighter band (except White band - stay on White and build strength)",
        tooMany: "If you can complete more than 40 full range repetitions, move up to a heavier band",
        optimal: "Aim to reach failure between 15-40 reps, then continue with partial reps until complete failure",
        failure: "After reaching failure in full range of motion, continue with partial range repetitions until complete muscular failure"
      },
      noSetsOrRest: "X3 is NOT traditional sets and reps - each exercise is performed once to complete failure, no rest periods between 'sets'",
      progressiveOverload: "Progress through band progression, not adding weight or reps"
    },

    hormonalOptimization: {
      concept: "Variable resistance training optimizes anabolic hormones better than traditional weights",
      keyHormones: {
        testosterone: "Stimulated by heavy loads and variable resistance",
        growthHormone: "Enhanced by training to failure and stabilization requirements",
        cortisol: "Minimized compared to prolonged cardio"
      },
      avoidCardio: "Prolonged cardio elevates cortisol, promoting fat retention and muscle breakdown"
    }
  },

  // Exercise Database - CORRECTED
  exercises: {
    push: {
      chestPress: {
        name: "Chest Press",
        primaryMuscles: ["Pectoralis Major", "Anterior Deltoids", "Triceps"],
        setup: "Stand on band center, handles at chest level, press forward and up",
        formCues: [
          "2 seconds up, 2 seconds down tempo",
          "Keep core engaged throughout movement",
          "Press handles together at full extension",
          "Control the negative portion",
          "Maintain slight bend in knees for stability",
          "Train to failure, then continue with partial reps"
        ],
        commonMistakes: [
          "Allowing handles to drift apart",
          "Rushing the negative (should be 2 seconds)",
          "Insufficient band tension at start",
          "Stopping at arbitrary rep count instead of failure"
        ],
        progressions: [
          "Start with band that allows 15-40 full reps to failure",
          "Progress to heavier band when achieving 40+ full reps",
          "Focus on time under tension and failure, not rep count"
        ]
      },
      
      tricepPress: {
        name: "Tricep Press",
        primaryMuscles: ["Triceps", "Posterior Deltoids"],
        setup: "Stand on band center, press handles overhead and back",
        formCues: [
          "2 seconds up, 2 seconds down tempo",
          "Keep elbows close to head",
          "Full extension at top",
          "Control descent",
          "Engage core for stability",
          "Train to failure, then partial reps"
        ],
        commonMistakes: [
          "Flaring elbows out too wide",
          "Incomplete range of motion",
          "Using shoulders instead of triceps",
          "Wrong tempo (not 2-2 cadence)"
        ],
        progressions: [
          "Select band allowing 15-40 reps to failure",
          "Focus on tricep isolation",
          "Progress bands when exceeding 40 full reps"
        ]
      },
      
      overheadPress: {
        name: "Overhead Press", 
        primaryMuscles: ["Deltoids", "Triceps", "Upper Chest"],
        setup: "Stand on band center, press handles straight overhead",
        formCues: [
          "2 seconds up, 2 seconds down tempo",
          "Drive through heels",
          "Keep core tight",
          "Press handles together overhead",
          "Maintain neutral spine",
          "Train to failure, then partials"
        ],
        commonMistakes: [
          "Arching back excessively",
          "Pressing behind head",
          "Insufficient core engagement",
          "Wrong tempo"
        ],
        progressions: [
          "Master movement pattern first",
          "Progress band resistance when exceeding 40 reps",
          "Focus on vertical pressing path"
        ]
      },
      
      frontSquat: {
        name: "Front Squat",
        primaryMuscles: ["Quadriceps", "Glutes", "Core"],
        setup: "Stand on band center, handles at shoulder level, squat down",
        formCues: [
          "2 seconds down, 2 seconds up tempo",
          "Keep chest up and core engaged",
          "Drive through heels",
          "Full depth squat",
          "Control the ascent",
          "Train to failure, then partial range"
        ],
        commonMistakes: [
          "Knees caving inward",
          "Forward lean",
          "Insufficient depth",
          "Wrong tempo"
        ],
        progressions: [
          "Master bodyweight squats first",
          "Add resistance gradually through band progression",
          "Focus on mobility and 15-40 rep range to failure"
        ]
      }
    },

    pull: {
      bentOverRow: {
        name: "Bent Over Row",
        primaryMuscles: ["Latissimus Dorsi", "Rhomboids", "Rear Deltoids", "Biceps"],
        setup: "Stand on band center, hinge at hips, pull handles to chest",
        formCues: [
          "2 seconds up, 2 seconds down tempo",
          "Maintain flat back",
          "Pull elbows back and up",
          "Squeeze shoulder blades together",
          "Control the negative",
          "Train to failure, then partials"
        ],
        commonMistakes: [
          "Rounding the back",
          "Using momentum to swing",
          "Not squeezing shoulder blades",
          "Wrong tempo"
        ],
        progressions: [
          "Start with proper hip hinge movement",
          "Focus on back muscle activation",
          "Progress through band colors based on 15-40 rep range"
        ]
      },
      
      bicepCurl: {
        name: "Bicep Curl",
        primaryMuscles: ["Biceps", "Forearms"],
        setup: "Stand on band center, curl handles to shoulders",
        formCues: [
          "2 seconds up, 2 seconds down tempo",
          "Keep elbows at sides",
          "Full range of motion",
          "Control the negative",
          "Don't swing or use momentum",
          "Train to failure, then partials"
        ],
        commonMistakes: [
          "Swinging the body",
          "Moving elbows forward",
          "Incomplete range of motion",
          "Wrong tempo"
        ],
        progressions: [
          "Master the movement pattern first",
          "Focus on bicep isolation",
          "Increase band resistance when exceeding 40 reps"
        ]
      },
      
      calfRaise: {
        name: "Calf Raise",
        primaryMuscles: ["Gastrocnemius", "Soleus"],
        setup: "Stand on band center, rise up on toes",
        formCues: [
          "2 seconds up, 2 seconds down tempo",
          "Full extension at top",
          "Control the descent",
          "Keep body straight",
          "Focus on calf contraction",
          "Train to failure, then partials"
        ],
        commonMistakes: [
          "Bouncing at the bottom",
          "Incomplete range of motion",
          "Using other muscles to assist",
          "Wrong tempo"
        ],
        progressions: [
          "Practice bodyweight calf raises",
          "Add band resistance gradually",
          "Focus on 15-40 reps to failure"
        ]
      },
      
      deadlift: {
        name: "Deadlift",
        primaryMuscles: ["Hamstrings", "Glutes", "Lower Back", "Traps"],
        setup: "Stand on band center, hinge at hips and pull up",
        formCues: [
          "2 seconds up, 2 seconds down tempo",
          "Keep back straight",
          "Drive through heels",
          "Engage core throughout",
          "Full hip extension at top",
          "Train to failure, then partials"
        ],
        commonMistakes: [
          "Rounding the back",
          "Knee-dominant movement",
          "Incomplete hip extension",
          "Wrong tempo"
        ],
        progressions: [
          "Master hip hinge pattern",
          "Start with appropriate band for 15-40 reps",
          "Focus on posterior chain activation"
        ]
      }
    }
  },

  // Band Information - CORRECTED with official force ranges
  bands: {
    colors: ["White", "Light Gray", "Gray", "Dark Gray", "Black"],
    progression: {
      white: { 
        resistance: "10-35 lbs", 
        level: "Beginner", 
        description: "Lightest resistance for form learning",
        note: "Cannot go lighter - stay on White and build strength if under 15 reps"
      },
      lightGray: { 
        resistance: "25-60 lbs", 
        level: "Beginner-Intermediate", 
        description: "Light resistance for muscle activation" 
      },
      gray: { 
        resistance: "50-120 lbs", 
        level: "Intermediate", 
        description: "Moderate resistance for strength building" 
      },
      darkGray: { 
        resistance: "70-150 lbs", 
        level: "Intermediate-Advanced", 
        description: "Heavy resistance for strength gains" 
      },
      black: { 
        resistance: "100-300+ lbs", 
        level: "Advanced", 
        description: "Maximum resistance for elite strength" 
      }
    },
    selection: {
      guidelines: [
        "Choose band that allows 15-40 full reps to failure",
        "Progress to heavier band when achieving 40+ full reps",
        "Move down if unable to achieve 15 full reps (except White)",
        "Form always takes priority over band color",
        "Different exercises may require different bands"
      ]
    }
  },

  // Program Structure - CORRECTED
  program: {
    schedule: {
      weeks1to4: {
        pattern: "Push/Pull/Rest/Push/Pull/Rest/Rest",
        description: "Adaptation phase with extra recovery",
        focus: "Learning movement patterns, building base strength, adapting to failure training"
      },
      weeks5plus: {
        pattern: "Push/Pull/Push/Pull/Push/Pull/Rest", 
        description: "Intensification phase with increased frequency",
        focus: "Maximizing strength and muscle growth through consistent failure training"
      }
    },
    
    progression: {
      daily: "Train each exercise to complete failure, not to a rep count",
      weekly: "Assess band progression based on 15-40 rep performance",
      monthly: "Evaluate overall program adherence and band selections",
      quarterly: "Reassess goals and program structure"
    },

    restDays: {
      importance: "Essential for muscle recovery and growth - this is when gains happen",
      activities: [
        "Light walking or stretching",
        "Focus on nutrition and hydration", 
        "Quality sleep for recovery",
        "Avoid intense physical activity"
      ]
    }
  },

  // Nutrition Guidelines - From official sources
  nutrition: {
    principles: [
      "Prioritize protein intake (2.2-2.5g per kg bodyweight)",
      "Focus on animal proteins for superior amino acid profiles",
      "Consider intermittent fasting for hormonal optimization",
      "Eliminate sugar and processed carbohydrates",
      "Hydration is crucial for performance and recovery"
    ],
    
    timing: {
      preWorkout: "Light protein 30-60 minutes before training",
      postWorkout: "Not critical - anabolic window extends 36+ hours",
      daily: "Focus on total daily protein over timing"
    },

    supplements: {
      fortagen: "Essential amino acids - 5x more efficient than standard protein",
      postWorkoutCarbs: "0.5-0.7g per pound bodyweight within 30 minutes for muscle hydration"
    }
  },

  // Common Questions & Troubleshooting - UPDATED
  faq: {
    plateaus: {
      question: "What if I stop progressing?",
      answers: [
        "Ensure you're truly training to failure (not just fatigue)",
        "Check tempo - 2 seconds up, 2 seconds down",
        "Consider if you need to progress to heavier band",
        "Evaluate recovery factors (sleep, nutrition, stress)",
        "Make sure you're doing partial reps after failure"
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
        "More is not always better - follow the program",
        "Weeks 1-4: Push/Pull/Rest/Push/Pull/Rest/Rest",
        "Weeks 5+: Push/Pull/Push/Pull/Push/Pull/Rest"
      ]
    },

    reps: {
      question: "What if I can't get 15 reps or I get more than 40?",
      answers: [
        "Under 15 reps: Move to lighter band (except White - stay and build)",
        "Over 40 reps: Progress to heavier band",
        "15-40 reps: Perfect range - continue with partials after failure",
        "Focus on failure, not hitting specific numbers"
      ]
    }
  }
}

// Coaching Prompts and Responses - CORRECTED
export const COACHING_RESPONSES = {
  motivation: [
    "Train to failure, not to a number - that's the X3 way!",
    "Variable resistance is giving you 7x more muscle activation than weights!",
    "Every rep to failure is building strength that traditional weights can't match!",
    "You're triggering superior hormonal responses with every X3 session!",
    "Remember: it's about reaching failure, not completing a set number!"
  ],
  
  form: [
    "Focus on that 2-second up, 2-second down tempo!",
    "Keep that variable resistance tension throughout the full range",
    "Remember to continue with partials after reaching full-range failure",
    "Quality over quantity - proper form leads to optimal results",
    "Feel that resistance increasing as you reach your strongest point!"
  ],
  
  progression: [
    "Time to consider progressing to the next band color!",
    "Your failure point is improving - that's real X3 progress!",
    "Consistency with failure training is building your strength foundation",
    "Band progression is your path to continued growth",
    "Trust the X3 process - failure training works!"
  ],
  
  recovery: [
    "Rest days are growth days - your muscles are adapting!",
    "Recovery is not optional - it's where the gains actually happen",
    "Use this time to focus on protein and hydration",
    "Light movement today will prep you for tomorrow's failure training",
    "Your hormones are optimizing during this recovery period"
  ]
}

// Generate contextual coaching advice - UPDATED
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
      primaryMuscles: exercise.primaryMuscles,
      tempo: "2 seconds up, 2 seconds down"
    }
  }
  
  // Week-specific guidance
  if (week && week <= 4) {
    return {
      focus: X3_KNOWLEDGE_BASE.program.schedule.weeks1to4.focus,
      advice: "You're in the adaptation phase - focus on learning proper form and training to failure."
    }
  }
  
  // Band progression advice
  if (bandColor && reps) {
    if (reps > 40) {
      return {
        progression: `With ${reps} full reps on the ${bandColor} band, you're ready to progress to a heavier resistance!`,
        nextStep: "Time to move to the next band color for optimal muscle challenge."
      }
    } else if (reps < 15 && bandColor !== 'White') {
      return {
        progression: `With only ${reps} reps on the ${bandColor} band, consider moving to a lighter band.`,
        nextStep: "Proper rep range is 15-40 for optimal X3 results."
      }
    }
  }
  
  return {
    general: "Focus on 2-second tempo, train to failure, and trust the X3 process for maximum results!"
  }
}
