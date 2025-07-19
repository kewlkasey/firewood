
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { registerUser } from "../lib/auth"
import { supabase } from "../lib/supabase"

interface TestResult {
  test: string
  status: "pending" | "success" | "error" | "warning"
  message: string
  details?: any
}

export default function RegistrationTester() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [testEmail, setTestEmail] = useState("")

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result])
  }

  const clearResults = () => {
    setResults([])
  }

  const generateTestEmail = () => {
    const randomInt = Math.floor(Math.random() * 1000000) + 1
    return `wright.casey+flf${randomInt}@gmail.com`
  }

  const runRegistrationTests = async () => {
    setIsRunning(true)
    clearResults()
    
    const email = generateTestEmail()
    setTestEmail(email)

    try {
      // Test 1: Database Connection
      addResult({ test: "Database Connection", status: "pending", message: "Testing connection..." })
      try {
        const { data, error } = await supabase.from("profiles").select("count", { count: "exact", head: true })
        if (error) throw error
        addResult({ 
          test: "Database Connection", 
          status: "success", 
          message: "Connected successfully",
          details: { profileCount: data }
        })
      } catch (error: any) {
        addResult({ 
          test: "Database Connection", 
          status: "error", 
          message: error.message 
        })
        return
      }

      // Test 2: Profile Creation Function
      addResult({ test: "Profile Function Check", status: "pending", message: "Checking create_profile_for_user function..." })
      try {
        // Use a proper UUID format for testing
        const testUuid = "00000000-0000-0000-0000-000000000000"
        const { data, error } = await supabase.rpc("create_profile_for_user", {
          user_id: testUuid,
          user_email: "test@test.com",
          first_name: "Test",
          last_name: "User"
        })
        if (error && !error.message.includes("duplicate key") && !error.message.includes("foreign_key_violation")) {
          throw error
        }
        addResult({ 
          test: "Profile Function Check", 
          status: "success", 
          message: "Function exists and callable" 
        })
      } catch (error: any) {
        addResult({ 
          test: "Profile Function Check", 
          status: "warning", 
          message: `Function test: ${error.message}` 
        })
      }

      // Test 3: Email Validation
      addResult({ test: "Email Validation", status: "pending", message: "Testing email format validation..." })
      const emailRegex = /\S+@\S+\.\S+/
      if (emailRegex.test(email)) {
        addResult({ 
          test: "Email Validation", 
          status: "success", 
          message: `Valid email format: ${email}` 
        })
      } else {
        addResult({ 
          test: "Email Validation", 
          status: "error", 
          message: "Invalid email format" 
        })
      }

      // Test 4: Registration Attempt
      addResult({ test: "Registration Process", status: "pending", message: "Attempting user registration..." })
      try {
        const registrationData = {
          email,
          password: "TestPassword123!",
          firstName: "Registration",
          lastName: "Test"
        }

        const result = await registerUser(registrationData)
        
        if (result?.user) {
          addResult({ 
            test: "Registration Process", 
            status: "success", 
            message: "User created successfully",
            details: {
              userId: result.user.id,
              email: result.user.email,
              emailConfirmed: result.user.email_confirmed_at ? true : false
            }
          })

          // Test 5: Profile Creation Check (after delay)
          addResult({ test: "Profile Creation", status: "pending", message: "Checking if profile was created..." })
          
          // Wait for potential trigger to execute
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", result.user.id)
            .single()

          if (profileError) {
            if (profileError.code === "PGRST116") {
              addResult({ 
                test: "Profile Creation", 
                status: "warning", 
                message: "Profile not created automatically - trigger may not be working" 
              })
              
              // Try manual profile creation
              addResult({ test: "Manual Profile Creation", status: "pending", message: "Attempting manual profile creation..." })
              try {
                const { data: manualProfile, error: manualError } = await supabase.rpc("create_profile_for_user", {
                  user_id: result.user.id,
                  user_email: email,
                  first_name: "Registration",
                  last_name: "Test"
                })
                
                if (manualError) throw manualError
                
                addResult({ 
                  test: "Manual Profile Creation", 
                  status: "success", 
                  message: "Profile created manually" 
                })
              } catch (manualError: any) {
                addResult({ 
                  test: "Manual Profile Creation", 
                  status: "error", 
                  message: manualError.message 
                })
              }
            } else {
              addResult({ 
                test: "Profile Creation", 
                status: "error", 
                message: profileError.message 
              })
            }
          } else {
            addResult({ 
              test: "Profile Creation", 
              status: "success", 
              message: "Profile created successfully",
              details: profile
            })
          }

          // Test 6: Cleanup
          addResult({ test: "Cleanup", status: "pending", message: "Cleaning up test user..." })
          try {
            // Note: In production, you'd want proper admin cleanup
            // For now, just mark as completed
            addResult({ 
              test: "Cleanup", 
              status: "warning", 
              message: "Test user created - manual cleanup may be needed" 
            })
          } catch (cleanupError: any) {
            addResult({ 
              test: "Cleanup", 
              status: "warning", 
              message: "Could not clean up test user" 
            })
          }

        } else {
          addResult({ 
            test: "Registration Process", 
            status: "error", 
            message: "Registration returned no user data" 
          })
        }

      } catch (registrationError: any) {
        addResult({ 
          test: "Registration Process", 
          status: "error", 
          message: registrationError.message,
          details: registrationError
        })
      }

    } catch (error: any) {
      addResult({ 
        test: "Overall Test", 
        status: "error", 
        message: `Unexpected error: ${error.message}` 
      })
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "pending":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
    }
  }

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f1e8] to-white p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#5e4b3a]">Registration System Tester</CardTitle>
            <CardDescription>
              Comprehensive testing for the FindLocalFirewood registration flow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <Button 
                onClick={runRegistrationTests} 
                disabled={isRunning}
                className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  "Run Registration Tests"
                )}
              </Button>
              
              <Button 
                onClick={clearResults} 
                variant="outline"
                className="border-[#5e4b3a] text-[#5e4b3a]"
              >
                Clear Results
              </Button>
            </div>

            {testEmail && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Test Email:</strong> {testEmail}
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-[#5e4b3a]">Test Results</h3>
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.test}</span>
                        </div>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                      {result.details && (
                        <details className="text-xs bg-gray-50 p-2 rounded">
                          <summary className="cursor-pointer font-medium">Details</summary>
                          <pre className="mt-2 whitespace-pre-wrap">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>

                {/* Copy-Paste Summary */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-[#5e4b3a] mb-3">Copy-Paste Summary for AI</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Click to select all text below:</p>
                    <textarea
                      readOnly
                      className="w-full h-40 text-xs font-mono bg-white border rounded p-2 resize-none"
                      value={`REGISTRATION TEST RESULTS - ${new Date().toLocaleString()}
Test Email: ${testEmail}
===========================================

${results.map(result => {
  const statusEmoji = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : result.status === 'warning' ? '⚠️' : '⏳';
  return `${statusEmoji} ${result.test}: ${result.status.toUpperCase()}
   Message: ${result.message}${result.details ? `
   Details: ${JSON.stringify(result.details, null, 2)}` : ''}`;
}).join('\n\n')}

===========================================
SUMMARY:
- Total Tests: ${results.length}
- Successful: ${results.filter(r => r.status === 'success').length}
- Failed: ${results.filter(r => r.status === 'error').length}
- Warnings: ${results.filter(r => r.status === 'warning').length}
- Overall Status: ${results.every(r => r.status === 'success') ? 'ALL PASSED' : results.some(r => r.status === 'error') ? 'FAILURES DETECTED' : 'COMPLETED WITH WARNINGS'}`}
                      onClick={(e) => e.currentTarget.select()}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
