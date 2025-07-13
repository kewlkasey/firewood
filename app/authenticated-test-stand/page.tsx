"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AuthenticatedTestStandPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the test stand with a specific ID
    router.push("/authenticated-test-stand/60ef2396-26ff-4a80-b77c-e9edfcd454cc")
  }, [router])

  return (
    <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center">
      <p className="text-[#5e4b3a]">Redirecting to test stand...</p>
    </div>
  )
}