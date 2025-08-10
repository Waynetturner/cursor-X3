'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { supabase } from '@/lib/supabase'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
  details?: {
    error?: string;
    data?: Record<string, unknown>;
    count?: number;
    [key: string]: unknown;
  }
}

export default function SupabaseConnectionTester() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const updateTest = (name: string, status: TestResult['status'], message: string, details?: TestResult['details']) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name)
      const newTest = { name, status, message, details }
      
      if (existing) {
        return prev.map(t => t.name === name ? newTest : t)
      } else {
        return [...prev, newTest]
      }
    })
  }

  const runTests = async () => {
    setIsRunning(true)
    setTests([])

    // Test 1: Environment Variables
    updateTest('Environment Variables', 'pending', 'Checking environment variables...')
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('🔍 Environment Check:', {
        url: supabaseUrl,
        anonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Missing',
        urlLength: supabaseUrl?.length,
        keyLength: supabaseAnonKey?.length
      })

      if (!supabaseUrl || !supabaseAnonKey) {
        updateTest('Environment Variables', 'error', 'Missing required environment variables', {
          url: !!supabaseUrl,
          anonKey: !!supabaseAnonKey
        })
      } else {
        updateTest('Environment Variables', 'success', 'Environment variables found', {
          url: supabaseUrl,
          anonKeyPreview: `${supabaseAnonKey.substring(0, 20)}...`
        })
      }
    } catch (error) {
      updateTest('Environment Variables', 'error', 'Error checking environment variables', error)
    }

    // Test 2: Client Creation
    updateTest('Client Creation', 'pending', 'Creating Supabase client...')
    try {
      const testClient = createClientComponentClient()
      console.log('🔍 Client Creation:', testClient)
      
      updateTest('Client Creation', 'success', 'Supabase client created successfully', {
        clientExists: !!testClient,
        hasAuthMethods: typeof testClient.auth !== 'undefined',
        hasFromMethod: typeof testClient.from !== 'undefined'
      })
    } catch (error) {
      console.error('❌ Client Creation Error:', error)
      updateTest('Client Creation', 'error', 'Failed to create Supabase client', error)
    }

    // Test 3: Basic Connection
    updateTest('Basic Connection', 'pending', 'Testing basic connection...')
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      console.log('🔍 Basic Connection Test:', { data, error })
      
      if (error) {
        updateTest('Basic Connection', 'error', `Connection failed: ${error.message}`, {
          code: error.code,
          details: error.details,
          hint: error.hint
        })
      } else {
        updateTest('Basic Connection', 'success', 'Successfully connected to Supabase', data)
      }
    } catch (error) {
      console.error('❌ Basic Connection Error:', error)
      updateTest('Basic Connection', 'error', 'Network or connection error', error)
    }

    // Test 4: Authentication Status
    updateTest('Authentication', 'pending', 'Checking authentication...')
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('🔍 Auth Check:', { session: !!session, error })
      
      if (error) {
        updateTest('Authentication', 'error', `Auth error: ${error.message}`, error)
      } else {
        updateTest('Authentication', 'success', session ? 'User authenticated' : 'No active session (normal for testing)', {
          hasSession: !!session,
          userId: session?.user?.id
        })
      }
    } catch (error) {
      console.error('❌ Auth Error:', error)
      updateTest('Authentication', 'error', 'Authentication check failed', error)
    }

    // Test 5: Database Schema Check
    updateTest('Database Schema', 'pending', 'Checking database tables...')
    try {
      // Try to access common tables
      const tables = ['profiles', 'workouts', 'exercises']
      const tableResults = []
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('*').limit(1)
          tableResults.push({
            table,
            exists: !error,
            error: error?.message,
            hasData: data && data.length > 0
          })
        } catch (err) {
          tableResults.push({
            table,
            exists: false,
            error: err instanceof Error ? err.message : 'Unknown error'
          })
        }
      }
      
      console.log('🔍 Schema Check:', tableResults)
      
      const existingTables = tableResults.filter(t => t.exists)
      if (existingTables.length > 0) {
        updateTest('Database Schema', 'success', `Found ${existingTables.length} accessible tables`, tableResults)
      } else {
        updateTest('Database Schema', 'error', 'No accessible tables found', tableResults)
      }
    } catch (error) {
      console.error('❌ Schema Error:', error)
      updateTest('Database Schema', 'error', 'Schema check failed', error)
    }

    // Test 6: RLS Policy Check
    updateTest('Row Level Security', 'pending', 'Testing RLS policies...')
    try {
      // Test insert without auth (should fail with RLS)
      const { data, error } = await supabase
        .from('profiles')
        .insert({ id: 'test-id', email: 'test@example.com' })
      
      console.log('🔍 RLS Test:', { data, error })
      
      if (error && error.code === '42501') {
        updateTest('Row Level Security', 'success', 'RLS is properly configured (insert blocked)', {
          code: error.code,
          message: error.message
        })
      } else if (error) {
        updateTest('Row Level Security', 'error', `Unexpected RLS error: ${error.message}`, error)
      } else {
        updateTest('Row Level Security', 'error', 'RLS may not be configured (insert succeeded)', data)
      }
    } catch (error) {
      console.error('❌ RLS Error:', error)
      updateTest('Row Level Security', 'error', 'RLS check failed', error)
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'success': return '✅'
      case 'error': return '❌'
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600'
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Supabase Connection Tester</h2>
        <p className="text-gray-600">Comprehensive testing of Supabase connectivity and configuration</p>
      </div>

      <button
        onClick={runTests}
        disabled={isRunning}
        className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? 'Running Tests...' : 'Run Connection Tests'}
      </button>

      {tests.length > 0 && (
        <div className="space-y-4">
          {tests.map((test, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span>{getStatusIcon(test.status)}</span>
                  {test.name}
                </h3>
                <span className={`text-sm font-medium ${getStatusColor(test.status)}`}>
                  {test.status.toUpperCase()}
                </span>
              </div>
              
              <p className={`text-sm mb-2 ${getStatusColor(test.status)}`}>
                {test.message}
              </p>
              
              {test.details && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    View Details
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(test.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {tests.length > 0 && !isRunning && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Test Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tests.filter(t => t.status === 'success').length}
              </div>
              <div className="text-gray-600">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {tests.filter(t => t.status === 'error').length}
              </div>
              <div className="text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {tests.filter(t => t.status === 'pending').length}
              </div>
              <div className="text-gray-600">Pending</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}