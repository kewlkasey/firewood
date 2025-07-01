"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function DatabaseTestButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const log = (message: string) => {
    console.log(message)
    setResults((prev) => [...prev, message])
  }

  const testDatabase = async () => {
    setIsLoading(true)
    setResults([])

    try {
      log("🔍 Starting full registration flow test...")

      // Import modules safely
      let supabase, registerUser
      try {
        const supabaseModule = await import("../lib/supabase")
        const authModule = await import("../lib/auth")
        supabase = supabaseModule.supabase
        registerUser = authModule.registerUser
      } catch (importError) {
        log(`❌ Failed to import modules: ${importError}`)
        return
      }

      // Test 1: Current state
      log("1. Current state before registration...")
      const { data: initialUserCount } = await supabase.rpc("check_auth_users")
      const { count: initialProfileCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })
      log(`✅ Initial - Users: ${initialUserCount}, Profiles: ${initialProfileCount}`)

      // Test 2: Register a new user
      log("2. Testing new user registration...")
      const testEmail = `wright.casey@gmail.com`
      const testData = {
        email: testEmail,
        password: "TestPassword123!",
        firstName: "Casey",
        lastName: "Wright",
      }

      try {
        log(`Attempting to register: ${testEmail}`)
        const registrationResult = await registerUser(testData)

        if (registrationResult?.user) {
          log(`✅ Registration successful!`)
          log(`   User ID: ${registrationResult.user.id.substring(0, 8)}...`)
          log(`   Email: ${registrationResult.user.email}`)
        } else {
          log(`❌ Registration failed - no user returned`)
        }
      } catch (regError: any) {
        if (regError.message?.includes("User already registered")) {
          log(`ℹ️  User already exists: ${testEmail}`)
        } else {
          log(`❌ Registration error: ${regError.message}`)
        }
      }

      // Test 3: Check final state
      log("3. Final state after registration...")
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait for trigger

      const { data: finalUserCount } = await supabase.rpc("check_auth_users")
      const { count: finalProfileCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })
      log(`✅ Final - Users: ${finalUserCount}, Profiles: ${finalProfileCount}`)

      // Test 4: Check if wright.casey@gmail.com has a profile
      log("4. Checking wright.casey@gmail.com profile...")
      const { data: caseyProfile, error: caseyError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", testEmail)
        .single()

      if (caseyError) {
        if (caseyError.code === "PGRST116") {
          log(`❌ No profile found for ${testEmail}`)

          // Try to create one manually
          log("5. Attempting manual profile creation...")
          const { data: manualResult, error: manualError } = await supabase.rpc("create_profile_for_existing_user", {
            target_email: testEmail,
          })

          if (manualError) {
            log(`❌ Manual creation failed: ${manualError.message}`)
          } else {
            log(`✅ Manual creation result: ${JSON.stringify(manualResult)}`)
          }
        } else {
          log(`❌ Profile check error: ${caseyError.message}`)
        }
      } else {
        log(`✅ Profile found for ${testEmail}:`)
        log(`   Name: ${caseyProfile.first_name} ${caseyProfile.last_name}`)
        log(`   Created: ${caseyProfile.created_at}`)
      }

      log("🎉 Full registration flow test completed!")
    } catch (error: any) {
      log(`💥 Unexpected error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-[#5e4b3a] mb-4">Full Registration Flow Test</h2>
      <p className="text-[#5e4b3a]/70 mb-4">
        Testing the complete user registration process including automatic profile creation.
      </p>

      <Button onClick={testDatabase} disabled={isLoading} className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white mb-4">
        {isLoading ? "Testing Registration..." : "Test Full Registration Flow"}
      </Button>

      {results.length > 0 && (
        <div className="bg-gray-100 p-4 rounded-md max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          <div className="text-sm whitespace-pre-wrap font-mono">
            {results.map((result, index) => (
              <div key={index} className="mb-1">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
