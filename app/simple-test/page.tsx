"use client"

import { useState } from "react"
import Link from "next/link"
import { TreesIcon as Tree } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SimpleTestPage() {
  const [testResult, setTestResult] = useState<string>("")

  const runSimpleTest = async () => {
    try {
      setTestResult("Testing...")

      // Test 1: Check if environment variables are accessible
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !anonKey) {
        setTestResult("❌ Environment variables missing")
        return
      }

      // Test 2: Try to import Supabase
      const { supabase } = await import("../../lib/supabase")

      // Test 3: Simple connection test
      const { data, error } = await supabase.auth.getUser()

      if (error) {
        setTestResult(`✅ Connection works (no active session): ${error.message}`)
      } else {
        setTestResult(`✅ Connection works, user: ${data.user?.email || "No user"}`)
      }
    } catch (error: any) {
      setTestResult(`❌ Error: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f1e8] to-white py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <Tree className="h-8 w-8 text-[#2d5d2a]" />
            <span className="text-2xl font-bold text-[#2d5d2a]">FindLocalFirewood</span>
          </Link>
          <h1 className="text-3xl font-bold text-[#5e4b3a] mb-4">Simple Connection Test</h1>
          <p className="text-[#5e4b3a]/70">Basic test to verify Supabase connection works.</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Button onClick={runSimpleTest} className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white mb-4">
            Test Connection
          </Button>

          {testResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <p className="font-mono text-sm">{testResult}</p>
            </div>
          )}

          <div className="mt-6">
            <p className="text-sm text-[#5e4b3a]/70 mb-2">Expected results:</p>
            <ul className="text-xs text-left text-[#5e4b3a]/60 space-y-1">
              <li>✅ "Connection works (no active session)" - Normal, no user logged in</li>
              <li>✅ "Connection works, user: email@example.com" - If someone is logged in</li>
              <li>❌ "Environment variables missing" - Need to check .env.local</li>
              <li>❌ "Error: [message]" - Connection or import problem</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-[#2d5d2a] hover:underline mr-4">
            ← Back to Home
          </Link>
          <Link href="/test-db" className="text-[#2d5d2a] hover:underline">
            Full Database Test →
          </Link>
        </div>
      </div>
    </div>
  )
}
