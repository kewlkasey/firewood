
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"

export default function DebugProduction() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runDebugTests()
  }, [])

  const runDebugTests = async () => {
    const debug: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      tests: {}
    }

    try {
      // Test 1: Basic Supabase connection
      console.log('Testing Supabase connection...')
      const { data: authData, error: authError } = await supabase.auth.getUser()
      debug.tests.auth = { success: !authError, error: authError?.message, user: authData?.user?.email }

      // Test 2: getCurrentUser function
      console.log('Testing getCurrentUser...')
      try {
        const currentUser = await getCurrentUser()
        debug.tests.getCurrentUser = { success: true, user: currentUser }
      } catch (error: any) {
        debug.tests.getCurrentUser = { success: false, error: error.message }
      }

      // Test 3: Stand verifications query
      console.log('Testing stand verifications query...')
      const testStandId = '60ef2396-26ff-4a80-b77c-e9edfcd454cc' // Use the stand ID from your URL
      const { data: verificationData, error: verificationError } = await supabase
        .from('stand_verifications')
        .select(`
          id,
          verified_at,
          verification_notes,
          inventory_level,
          confirmed_payment_methods,
          anonymous_name,
          user_id
        `)
        .eq('stand_id', testStandId)
        .order('verified_at', { ascending: false })
        .limit(5)

      debug.tests.standVerifications = { 
        success: !verificationError, 
        error: verificationError?.message,
        count: verificationData?.length || 0,
        data: verificationData
      }

      // Test 4: Profiles query
      console.log('Testing profiles query...')
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .limit(3)

      debug.tests.profiles = { 
        success: !profileError, 
        error: profileError?.message,
        count: profileData?.length || 0
      }

      // Test 5: Stand details query
      console.log('Testing stand details query...')
      const { data: standData, error: standError } = await supabase
        .from('firewood_stands')
        .select('*')
        .eq('id', testStandId)
        .single()

      debug.tests.standDetails = { 
        success: !standError, 
        error: standError?.message,
        hasData: !!standData
      }

    } catch (error: any) {
      debug.tests.globalError = error.message
    }

    setDebugInfo(debug)
    setLoading(false)
  }

  if (loading) {
    return <div className="p-8">Loading debug info...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Production Debug Information</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Environment Info</h2>
          <p><strong>Environment:</strong> {debugInfo.environment}</p>
          <p><strong>Supabase URL:</strong> {debugInfo.supabaseUrl || 'NOT SET'}</p>
          <p><strong>Has Anon Key:</strong> {debugInfo.hasAnonKey ? 'YES' : 'NO'}</p>
          <p><strong>User Agent:</strong> {debugInfo.userAgent}</p>
          <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
        </div>

        {Object.entries(debugInfo.tests || {}).map(([testName, result]: [string, any]) => (
          <div key={testName} className={`p-4 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <h3 className="font-bold">{testName}</h3>
            <p><strong>Success:</strong> {result.success ? 'YES' : 'NO'}</p>
            {result.error && <p><strong>Error:</strong> {result.error}</p>}
            {result.count !== undefined && <p><strong>Count:</strong> {result.count}</p>}
            {result.user && <p><strong>User:</strong> {JSON.stringify(result.user)}</p>}
            {result.data && (
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">View Data</summary>
                <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8">
        <button 
          onClick={runDebugTests}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Run Tests Again
        </button>
      </div>
    </div>
  )
}
