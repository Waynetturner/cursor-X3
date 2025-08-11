'use client'

import { useState, useEffect } from 'react'
import { backendService, BackendStatus } from '@/lib/backend-integration'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, AlertCircle, Loader2, Database, Zap, Workflow } from 'lucide-react'
import type { User } from '@supabase/auth-helpers-nextjs'

interface DataFlowResult {
  step1_ui_to_supabase: boolean;
  step2_supabase_to_edge: boolean;
  step3_edge_to_n8n: boolean;
  step4_n8n_to_ui: boolean;
  overall_success: boolean;
  errors: string[];
}

export default function BackendTester() {
  const [status, setStatus] = useState<BackendStatus | null>(null)
  const [dataFlowResult, setDataFlowResult] = useState<DataFlowResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    checkBackendStatus()
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const checkBackendStatus = async () => {
    setIsLoading(true)
    try {
      const backendStatus = await backendService.getBackendStatus()
      setStatus(backendStatus)
    } catch (error) {
      console.error('Backend status check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testDataFlow = async () => {
    setIsLoading(true)
    try {
      const result = await backendService.testDataFlow()
      setDataFlowResult(result)
    } catch (error) {
      console.error('Data flow test failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testCoaching = async (type: 'static' | 'dynamic') => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const response = await backendService.getCoachingResponse({
        user_id: user.id,
        user_feedback: 'Test feedback for backend integration',
        coaching_type: type,
      })
      console.log(`${type} coaching response:`, response)
      alert(`${type} coaching test successful! Check console for details.`)
    } catch (error) {
      console.error(`${type} coaching test failed:`, error)
      alert(`${type} coaching test failed. Check console for details.`)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    )
  }

  const getStatusText = (status: boolean) => {
    return status ? 'Connected' : 'Not Connected'
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <span className="ml-2">Testing backend integration...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Backend Integration Status</h2>
        <button
          onClick={checkBackendStatus}
          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
        >
          Refresh Status
        </button>
      </div>

      {status && (
        <div className="space-y-4">
          {/* Environment Configuration */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Environment Configuration</h3>
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.environment.configured)}
              <span className="text-sm">
                {status.environment.configured ? 'All required environment variables configured' : 'Missing environment variables'}
              </span>
            </div>
            {status.environment.missing_vars.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-red-600 font-medium">Missing variables:</p>
                <ul className="text-sm text-red-600 list-disc list-inside">
                  {status.environment.missing_vars.map((varName) => (
                    <li key={varName}>{varName}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Supabase Connection */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Database className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-medium text-gray-900">Supabase Database</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.supabase.connected)}
                <span className="text-sm">Connection: {getStatusText(status.supabase.connected)}</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.supabase.tables.workout_exercises)}
                <span className="text-sm">workout_exercises table: {getStatusText(status.supabase.tables.workout_exercises)}</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.supabase.tables.profiles)}
                <span className="text-sm">profiles table: {getStatusText(status.supabase.tables.profiles)}</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.supabase.tables.user_ui_settings)}
                <span className="text-sm">user_ui_settings table: {getStatusText(status.supabase.tables.user_ui_settings)}</span>
              </div>
            </div>
          </div>

          {/* Edge Functions */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-medium text-gray-900">Edge Functions</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.edgeFunctions.generate_speech)}
                <span className="text-sm">generate-speech: {getStatusText(status.edgeFunctions.generate_speech)}</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.edgeFunctions.coach_chat)}
                <span className="text-sm">coach-chat: {getStatusText(status.edgeFunctions.coach_chat)}</span>
              </div>
            </div>
          </div>

          {/* N8N Integration */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Workflow className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-medium text-gray-900">N8N Workflow</h3>
            </div>
            <div className="flex items-center space-x-2">
              {status.n8n.status === 'active' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : status.n8n.status === 'error' ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              <span className="text-sm">Status: {status.n8n.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* Test Buttons */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Integration Tests</h3>
        <div className="space-y-2">
          <button
            onClick={testDataFlow}
            disabled={!user}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Test Complete Data Flow
          </button>
          
          {user && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => testCoaching('static')}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Test Static Coaching
              </button>
              <button
                onClick={() => testCoaching('dynamic')}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
              >
                Test Dynamic Coaching
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Data Flow Results */}
      {dataFlowResult && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Data Flow Test Results</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              {getStatusIcon(dataFlowResult.step1_ui_to_supabase)}
              <span>Step 1: UI → Supabase</span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(dataFlowResult.step2_supabase_to_edge)}
              <span>Step 2: Supabase → Edge Functions</span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(dataFlowResult.step3_edge_to_n8n)}
              <span>Step 3: Edge Functions → N8N</span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(dataFlowResult.step4_n8n_to_ui)}
              <span>Step 4: N8N → UI</span>
            </div>
            <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
              {getStatusIcon(dataFlowResult.overall_success)}
              <span className="font-medium">
                Overall: {dataFlowResult.overall_success ? 'All systems operational' : 'Issues detected'}
              </span>
            </div>
            {dataFlowResult.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-red-600 font-medium">Errors:</p>
                <ul className="text-red-600 list-disc list-inside">
                  {dataFlowResult.errors.map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Setup Instructions</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>1. Configure environment variables in your .env.local file</p>
          <p>2. Deploy Edge Functions to your Supabase project</p>
          <p>3. Set up N8N workflow with OpenAI integration</p>
          <p>4. Run tests to verify all connections</p>
        </div>
      </div>
    </div>
  )
} 