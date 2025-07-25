'use client'

import { useState, useRef, useEffect } from 'react'
import { useWebLLMCoach } from '@/hooks/useWebLLMCoach'
import { X3_TEST_CASES, validateX3Response, runTestSuite, quickValidateResponse, type TestResult } from '@/lib/coach-testing-framework'

interface ChatMessage {
  id: string
  role: 'user' | 'coach'
  content: string
  timestamp: Date
  validation?: {
    warnings: string[]
    score?: number
  }
}

interface TestSession {
  id: string
  testerName: string
  startTime: Date
  endTime?: Date
  messages: ChatMessage[]
  testResults?: TestResult[]
  overallScore?: number
  feedback?: string
}

export default function CoachTesterPage() {
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [testerName, setTesterName] = useState('')
  const [testMode, setTestMode] = useState<'manual' | 'automated' | 'mixed'>('manual')
  const [currentTestIndex, setCurrentTestIndex] = useState(0)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [sessionStarted, setSessionStarted] = useState(false)
  const [showValidation, setShowValidation] = useState(true)
  const [messageIdCounter, setMessageIdCounter] = useState(0)
  const [isLocalGenerating, setIsLocalGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { generateResponse, isGenerating, isReady, initializeEngine } = useWebLLMCoach()
  
  // Use combined generating state
  const isActuallyGenerating = isGenerating || isLocalGenerating

  const generateMessageId = () => {
    setMessageIdCounter(prev => prev + 1)
    return `msg-${Date.now()}-${messageIdCounter + 1}`
  }

  // Prevent hydration mismatch by only rendering on client
  useEffect(() => {
    setMounted(true)
    // Initialize WebLLM engine for standalone testing (no userId needed)
    initializeEngine()
  }, [initializeEngine])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startTestSession = () => {
    if (!testerName.trim()) {
      alert('Please enter your name to start testing')
      return
    }
    
    setSessionStarted(true)
    setMessages([{
      id: generateMessageId(),
      role: 'coach',
      content: `Hello ${testerName}! I'm your X3 AI coach. I'm here to help you optimize your X3 workouts, provide form tips, and guide your training. What questions do you have about X3?`,
      timestamp: new Date()
    }])
  }

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || input.trim()
    if (!content || isActuallyGenerating) return

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLocalGenerating(true)

    try {
      // Add timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Response timeout after 30 seconds')), 30000)
      )
      
      // Remove biased context - let coach give general advice
      const responsePromise = generateResponse(content)
      
      const response = await Promise.race([responsePromise, timeoutPromise]) as string
      
      // Validate the response
      const validation = quickValidateResponse(response)
      
      const coachMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'coach',
        content: response,
        timestamp: new Date(),
        validation: {
          warnings: validation.warnings,
          score: validation.warnings.length === 0 ? 100 : Math.max(0, 100 - (validation.warnings.length * 25))
        }
      }

      setMessages(prev => [...prev, coachMessage])

      // If this was a test case, record the result
      if (testMode === 'automated' && currentTestIndex < X3_TEST_CASES.length) {
        const testCase = X3_TEST_CASES[currentTestIndex]
        const result = validateX3Response(response, testCase)
        setTestResults(prev => [...prev, result])
        setCurrentTestIndex(prev => prev + 1)
      }

    } catch (error) {
      console.error('Coach response error:', error)
      
      // Fallback to knowledge base response for testing
      let fallbackResponse = "I'm having trouble processing your question right now. "
      
      if (content.toLowerCase().includes('band') && content.toLowerCase().includes('progression')) {
        fallbackResponse = `Great question about band progression! Here's the X3 band progression system:

**X3 Band Colors & Resistance:**
• **White Band**: 10-35 lbs (Beginner)
• **Light Gray**: 25-60 lbs (Beginner-Intermediate)  
• **Gray**: 50-120 lbs (Intermediate)
• **Dark Gray**: 70-150 lbs (Intermediate-Advanced)
• **Black**: 100-300+ lbs (Advanced)

**When to Progress:**
- If you can complete MORE than 40 full-range reps → move up to the next heavier band
- If you CANNOT complete 15 full-range reps → move down to a lighter band (except stay on White if you're already there)
- Target range: 15-40 reps to complete failure, then continue with partial reps

Remember: You're training to failure, not to a specific number. The goal is progressive overload through band progression!`
      } else {
        fallbackResponse += "As your X3 coach, I'm here to help with workouts, form tips, and progression guidance. What specific aspect of X3 training would you like to discuss?"
      }
      
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'coach',
        content: fallbackResponse,
        timestamp: new Date(),
        validation: {
          warnings: error instanceof Error && error.message.includes('timeout') ? ['⚠️ Response timeout - using fallback'] : ['🚨 System Error - using fallback'],
          score: 75
        }
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLocalGenerating(false)
    }
  }

  const runAutomatedTests = async () => {
    setTestMode('automated')
    setCurrentTestIndex(0)
    setTestResults([])
    
    for (let i = 0; i < X3_TEST_CASES.length; i++) {
      const testCase = X3_TEST_CASES[i]
      setCurrentTestIndex(i)
      
      // Add a delay to make it feel more natural
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      await handleSendMessage(testCase.question)
      
      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // Generate final report
    const suite = runTestSuite(
      testResults.reduce((acc, result) => {
        acc[result.testId] = result.response
        return acc
      }, {} as {[key: string]: string})
    )
    
    const reportMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'coach',
      content: `**Automated Test Results:**\n\n${suite.summary}`,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, reportMessage])
  }

  const suggestTestQuestion = () => {
    if (currentTestIndex < X3_TEST_CASES.length) {
      const testCase = X3_TEST_CASES[currentTestIndex]
      setInput(testCase.question)
    }
  }

  const exportSession = () => {
    const session: TestSession = {
      id: generateMessageId(),
      testerName,
      startTime: new Date(sessionStarted ? messages[0]?.timestamp || new Date() : new Date()),
      endTime: new Date(),
      messages,
      testResults: testResults.length > 0 ? testResults : undefined,
      overallScore: testResults.length > 0 ? testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length : undefined
    }

    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `x3-coach-test-${testerName}-${generateMessageId()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Prevent hydration mismatch - only render on client
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">X3 Coach Tester</h1>
            <p className="text-gray-600">Help us test the X3 AI coach accuracy</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={testerName}
                onChange={(e) => setTesterName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Mode
              </label>
              <select
                value={testMode}
                onChange={(e) => setTestMode(e.target.value as 'manual' | 'automated' | 'mixed')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="manual">Manual Testing</option>
                <option value="automated">Automated Test Suite</option>
                <option value="mixed">Mixed (Manual + Guided)</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showValidation"
                checked={showValidation}
                onChange={(e) => setShowValidation(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="showValidation" className="text-sm text-gray-700">
                Show real-time validation warnings
              </label>
            </div>
            
            <button
              onClick={startTestSession}
              disabled={!testerName.trim() || !isReady}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {!isReady ? 'Loading Coach...' : 'Start Test Session'}
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Manual: Ask any X3-related questions</li>
              <li>• Automated: Runs predefined test cases</li>
              <li>• Mixed: Get suggested test questions</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">X3 Coach Tester</h1>
            <p className="text-sm text-gray-600">Testing with {testerName}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {testMode === 'mixed' && (
              <button
                onClick={suggestTestQuestion}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Suggest Question
              </button>
            )}
            
            {testMode === 'automated' && (
              <button
                onClick={runAutomatedTests}
                disabled={isGenerating}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
              >
                Run Tests ({currentTestIndex}/{X3_TEST_CASES.length})
              </button>
            )}
            
            <button
              onClick={exportSession}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Export Session
            </button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-200px)] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Validation warnings */}
                  {showValidation && message.role === 'coach' && message.validation?.warnings.length && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <div className="font-medium text-red-800">Validation Issues:</div>
                      {message.validation.warnings.map((warning, idx) => (
                        <div key={idx} className="text-red-700">{warning}</div>
                      ))}
                      {message.validation.score !== undefined && (
                        <div className="text-red-700 font-medium mt-1">
                          Score: {message.validation.score}%
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isActuallyGenerating && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Coach is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask the coach about X3 training..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isGenerating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
            
            {testMode === 'mixed' && currentTestIndex < X3_TEST_CASES.length && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <strong>Suggested test:</strong> {X3_TEST_CASES[currentTestIndex].description}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
