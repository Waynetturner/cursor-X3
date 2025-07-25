// X3 Coach Testing Framework
// Validates coach responses against official X3 methodology

export interface TestCase {
  id: string
  question: string
  expectedConcepts: string[]
  forbiddenConcepts: string[]
  category: 'tempo' | 'progression' | 'form' | 'nutrition' | 'program' | 'general'
  description: string
}

export interface TestResult {
  testId: string
  passed: boolean
  score: number
  response: string
  foundExpected: string[]
  foundForbidden: string[]
  feedback: string
}

// Official X3 methodology test cases
export const X3_TEST_CASES: TestCase[] = [
  // Tempo Testing
  {
    id: 'tempo-001',
    question: 'What tempo should I use for X3 exercises?',
    expectedConcepts: ['2 seconds up', '2 seconds down', '2-second'],
    forbiddenConcepts: ['4 seconds', '4-second', '3 seconds', '1 second'],
    category: 'tempo',
    description: 'Validates correct X3 tempo methodology'
  },
  {
    id: 'tempo-002', 
    question: 'How fast should I perform the negative portion of chest press?',
    expectedConcepts: ['2 seconds down', 'control', 'negative'],
    forbiddenConcepts: ['4 seconds', 'fast', 'explosive'],
    category: 'tempo',
    description: 'Tests specific negative tempo knowledge'
  },

  // Rep Range and Progression
  {
    id: 'reps-001',
    question: 'I can only do 12 reps on the gray band. What should I do?',
    expectedConcepts: ['lighter band', 'light gray', 'under 15', 'move down'],
    forbiddenConcepts: ['stay on gray', 'add weight', 'do more sets'],
    category: 'progression',
    description: 'Tests band regression logic for insufficient reps'
  },
  {
    id: 'reps-002',
    question: 'I can do 45 reps on the white band. What should I do?',
    expectedConcepts: ['progress', 'light gray', 'heavier band', 'over 40'],
    forbiddenConcepts: ['stay on white', 'add weight', 'more sets'],
    category: 'progression',
    description: 'Tests band progression logic for excess reps'
  },
  {
    id: 'reps-003',
    question: 'I can only do 10 reps on the white band. What should I do?',
    expectedConcepts: ['stay on white', 'build strength', 'cannot go lighter'],
    forbiddenConcepts: ['lighter band', 'reduce resistance'],
    category: 'progression', 
    description: 'Tests white band exception rule'
  },

  // Training Philosophy
  {
    id: 'philosophy-001',
    question: 'How many sets should I do for chest press?',
    expectedConcepts: ['one', 'once', 'failure', 'not sets', 'no sets'],
    forbiddenConcepts: ['3 sets', '4 sets', 'multiple sets', 'rest between sets'],
    category: 'program',
    description: 'Tests understanding that X3 is not sets-based'
  },
  {
    id: 'philosophy-002',
    question: 'Should I train to failure or stop at 20 reps?',
    expectedConcepts: ['failure', 'not to a number', 'complete failure', 'partial reps'],
    forbiddenConcepts: ['stop at 20', 'specific number', 'rep target'],
    category: 'program',
    description: 'Tests train-to-failure philosophy'
  },

  // Exercise Classification
  {
    id: 'classification-001',
    question: 'Is bicep curl a push or pull exercise?',
    expectedConcepts: ['pull', 'pull exercise', 'pull workout'],
    forbiddenConcepts: ['push', 'push exercise', 'push workout'],
    category: 'form',
    description: 'Tests basic exercise classification'
  },
  {
    id: 'classification-002',
    question: 'What exercises are in a push workout?',
    expectedConcepts: ['chest press', 'tricep press', 'overhead press', 'front squat'],
    forbiddenConcepts: ['bicep curl', 'bent row', 'deadlift'],
    category: 'program',
    description: 'Tests push workout exercise knowledge'
  },

  // Program Structure
  {
    id: 'program-001',
    question: 'What is the workout schedule for weeks 1-4?',
    expectedConcepts: ['Push/Pull/Rest/Push/Pull/Rest/Rest', 'adaptation phase', 'extra recovery'],
    forbiddenConcepts: ['Push/Pull/Push/Pull/Push/Pull/Rest', 'daily training'],
    category: 'program',
    description: 'Tests early program structure knowledge'
  },
  {
    id: 'program-002',
    question: 'What is the workout schedule for week 8?',
    expectedConcepts: ['Push/Pull/Push/Pull/Push/Pull/Rest', 'intensification', 'week 5+'],
    forbiddenConcepts: ['Push/Pull/Rest/Push/Pull/Rest/Rest', 'adaptation phase'],
    category: 'program',
    description: 'Tests advanced program structure knowledge'
  },

  // Anti-Cardio
  {
    id: 'cardio-001',
    question: 'Should I add cardio to my X3 routine for fat loss?',
    expectedConcepts: ['no cardio', 'elevates cortisol', 'fat retention', 'muscle breakdown'],
    forbiddenConcepts: ['add cardio', 'good for fat loss', 'combine with X3'],
    category: 'program',
    description: 'Tests anti-cardio stance'
  },

  // Nutrition
  {
    id: 'nutrition-001',
    question: 'How much protein should I eat for muscle building?',
    expectedConcepts: ['2.2-2.5g per kg', 'animal protein', 'superior amino'],
    forbiddenConcepts: ['1g per pound', 'plant protein equivalent'],
    category: 'nutrition',
    description: 'Tests protein intake recommendations'
  }
]

// Validation functions
export function validateX3Response(response: string, testCase: TestCase): TestResult {
  const lowerResponse = response.toLowerCase()
  
  // Check for expected concepts
  const foundExpected = testCase.expectedConcepts.filter(concept => 
    lowerResponse.includes(concept.toLowerCase())
  )
  
  // Check for forbidden concepts
  const foundForbidden = testCase.forbiddenConcepts.filter(concept =>
    lowerResponse.includes(concept.toLowerCase())
  )
  
  // Calculate score
  const expectedScore = (foundExpected.length / testCase.expectedConcepts.length) * 70
  const forbiddenPenalty = (foundForbidden.length / testCase.forbiddenConcepts.length) * 30
  const score = Math.max(0, expectedScore - forbiddenPenalty)
  
  // Determine pass/fail (70% threshold)
  const passed = score >= 70 && foundForbidden.length === 0
  
  // Generate feedback
  let feedback = `Score: ${score.toFixed(1)}%\n`
  
  if (foundExpected.length > 0) {
    feedback += `✅ Found expected concepts: ${foundExpected.join(', ')}\n`
  }
  
  const missingExpected = testCase.expectedConcepts.filter(concept => 
    !foundExpected.map(f => f.toLowerCase()).includes(concept.toLowerCase())
  )
  if (missingExpected.length > 0) {
    feedback += `❌ Missing expected concepts: ${missingExpected.join(', ')}\n`
  }
  
  if (foundForbidden.length > 0) {
    feedback += `🚫 Contains forbidden concepts: ${foundForbidden.join(', ')}\n`
  }
  
  return {
    testId: testCase.id,
    passed,
    score,
    response,
    foundExpected,
    foundForbidden,
    feedback
  }
}

export function runTestSuite(responses: {[testId: string]: string}): {
  overallScore: number
  passRate: number
  results: TestResult[]
  summary: string
} {
  const results: TestResult[] = []
  
  for (const testCase of X3_TEST_CASES) {
    const response = responses[testCase.id]
    if (response) {
      const result = validateX3Response(response, testCase)
      results.push(result)
    }
  }
  
  const passedTests = results.filter(r => r.passed).length
  const passRate = (passedTests / results.length) * 100
  const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
  
  const criticalFailures = results.filter(r => 
    !r.passed && ['tempo', 'progression', 'philosophy'].includes(
      X3_TEST_CASES.find(tc => tc.id === r.testId)?.category || ''
    )
  )
  
  let summary = `Overall Performance:\n`
  summary += `- Pass Rate: ${passRate.toFixed(1)}% (${passedTests}/${results.length})\n`
  summary += `- Average Score: ${overallScore.toFixed(1)}%\n`
  
  if (criticalFailures.length > 0) {
    summary += `\n🚨 Critical Failures in Core X3 Methodology:\n`
    criticalFailures.forEach(failure => {
      const testCase = X3_TEST_CASES.find(tc => tc.id === failure.testId)
      summary += `- ${testCase?.description}\n`
    })
  }
  
  const categoryResults = new Map<string, TestResult[]>()
  results.forEach(result => {
    const category = X3_TEST_CASES.find(tc => tc.id === result.testId)?.category || 'unknown'
    if (!categoryResults.has(category)) {
      categoryResults.set(category, [])
    }
    categoryResults.get(category)!.push(result)
  })
  
  summary += `\nCategory Breakdown:\n`
  for (const [category, categoryTests] of categoryResults) {
    const categoryPassed = categoryTests.filter(r => r.passed).length
    const categoryScore = categoryTests.reduce((sum, r) => sum + r.score, 0) / categoryTests.length
    summary += `- ${category}: ${categoryPassed}/${categoryTests.length} passed (${categoryScore.toFixed(1)}%)\n`
  }
  
  return {
    overallScore,
    passRate,
    results,
    summary
  }
}

// Test runner for async coach responses
export async function runCoachTest(
  generateResponse: (question: string) => Promise<string>,
  testCases: TestCase[] = X3_TEST_CASES
): Promise<{
  overallScore: number
  passRate: number
  results: TestResult[]
  summary: string
}> {
  const responses: {[testId: string]: string} = {}
  
  console.log(`🧪 Running ${testCases.length} X3 methodology tests...`)
  
  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.description}`)
      const response = await generateResponse(testCase.question)
      responses[testCase.id] = response
    } catch (error) {
      console.error(`Test ${testCase.id} failed:`, error)
      responses[testCase.id] = `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
  
  return runTestSuite(responses)
}

// Quick validation for real-time responses - Focus on knowledge gaps
export function quickValidateResponse(response: string): {
  hasTempoError: boolean
  hasSetsError: boolean
  hasCardioError: boolean
  hasRepRangeError: boolean
  isGuessing: boolean
  missingKnowledge: string[]
  warnings: string[]
} {
  const lowerResponse = response.toLowerCase()
  
  const hasTempoError = lowerResponse.includes('4 second') || lowerResponse.includes('4-second')
  const hasSetsError = lowerResponse.includes('sets') || lowerResponse.includes('3 sets') || lowerResponse.includes('4 sets')
  const hasCardioError = lowerResponse.includes('add cardio') || lowerResponse.includes('combine cardio')
  const hasRepRangeError = lowerResponse.includes('8-12 reps') || lowerResponse.includes('10-12 reps')
  
  // Detect when coach is guessing/hallucinating
  const guessWords = ['i recommend', 'i suggest', 'you should', 'considering you', 'since you']
  const isGuessing = guessWords.some(phrase => lowerResponse.includes(phrase)) && 
                   !lowerResponse.includes("i don't know") && 
                   !lowerResponse.includes("not in my knowledge")
  
  // Track missing knowledge topics
  const missingKnowledge: string[] = []
  if (lowerResponse.includes('x3 system') && lowerResponse.includes('recommend')) {
    missingKnowledge.push('X3 product systems/packages')
  }
  if (lowerResponse.includes('band system') && lowerResponse.includes('which')) {
    missingKnowledge.push('X3 system selection criteria')  
  }
  if (lowerResponse.includes('price') || lowerResponse.includes('cost')) {
    missingKnowledge.push('X3 pricing information')
  }
  if (lowerResponse.includes('buy') || lowerResponse.includes('purchase')) {
    missingKnowledge.push('X3 purchasing guidance')
  }
  
  const warnings: string[] = []
  if (hasTempoError) warnings.push('🚫 Incorrect tempo mentioned (should be 2 seconds)')
  if (hasSetsError) warnings.push('🚫 Traditional sets mentioned (X3 is single-effort to failure)')
  if (hasCardioError) warnings.push('🚫 Cardio recommendation (contradicts X3 methodology)')
  if (hasRepRangeError) warnings.push('🚫 Traditional rep ranges (X3 uses 15-40 reps to failure)')
  if (isGuessing) warnings.push('⚠️ Coach appears to be guessing/making assumptions')
  if (missingKnowledge.length > 0) {
    warnings.push(`📋 Missing knowledge: ${missingKnowledge.join(', ')}`)
  }
  
  return {
    hasTempoError,
    hasSetsError,
    hasCardioError,
    hasRepRangeError,
    isGuessing,
    missingKnowledge,
    warnings
  }
}
