"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { TreesIcon as Tree, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "../lib/supabase"

type ConfirmationState = "loading" | "success" | "error" | "expired"

export default function EmailConfirmation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<ConfirmationState>("loading")
  const [message, setMessage] = useState("")
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get the token and type from URL parameters
        const token = searchParams.get("token")
        const type = searchParams.get("type")

        if (!token || type !== "signup") {
          setState("error")
          setMessage("Invalid confirmation link")
          return
        }

        console.log("Confirming email with token:", token.substring(0, 10) + "...")

        // Verify the email using Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "signup",
        })

        if (error) {
          console.error("Email confirmation error:", error)

          if (error.message.includes("expired")) {
            setState("expired")
            setMessage("This confirmation link has expired. Please request a new one.")
          } else if (error.message.includes("already confirmed")) {
            setState("success")
            setMessage("Your email has already been confirmed!")
            setUserEmail(data?.user?.email || "")
          } else {
            setState("error")
            setMessage(error.message || "Failed to confirm email")
          }
          return
        }

        if (data?.user) {
          console.log("Email confirmed successfully:", data.user.email)
          setState("success")
          setMessage("Your email has been confirmed successfully!")
          setUserEmail(data.user.email || "")

          // Optional: Auto-redirect to login after a delay
          setTimeout(() => {
            router.push("/login?confirmed=true")
          }, 3000)
        } else {
          setState("error")
          setMessage("Confirmation failed - no user data received")
        }
      } catch (error: any) {
        console.error("Confirmation process error:", error)
        setState("error")
        setMessage("An unexpected error occurred during confirmation")
      }
    }

    confirmEmail()
  }, [searchParams, router])

  const resendConfirmation = async () => {
    if (!userEmail) {
      setMessage("No email address available for resending")
      return
    }

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: userEmail,
      })

      if (error) {
        setMessage(`Failed to resend confirmation: ${error.message}`)
      } else {
        setMessage("Confirmation email sent! Please check your inbox.")
      }
    } catch (error: any) {
      setMessage(`Error resending confirmation: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f1e8] to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <Tree className="h-8 w-8 text-[#2d5d2a]" />
            <span className="text-2xl font-bold text-[#2d5d2a]">FindLocalFirewood</span>
          </Link>
          <h2 className="text-3xl font-bold text-[#5e4b3a]">Email Confirmation</h2>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center space-y-6">
            {state === "loading" && (
              <>
                <div className="w-16 h-16 bg-[#f5f1e8] rounded-full flex items-center justify-center mx-auto">
                  <Loader2 className="h-8 w-8 text-[#2d5d2a] animate-spin" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#5e4b3a]">Confirming Your Email</h3>
                  <p className="text-sm text-[#5e4b3a]/70">Please wait while we verify your email address...</p>
                </div>
              </>
            )}

            {state === "success" && (
              <>
                <div className="w-16 h-16 bg-[#2d5d2a] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#5e4b3a]">Email Confirmed!</h3>
                  <p className="text-sm text-[#5e4b3a]/70">{message}</p>
                  {userEmail && <p className="text-xs text-[#5e4b3a]/60">Account: {userEmail}</p>}
                  <p className="text-xs text-[#2d5d2a] mt-4">Redirecting to login in 3 seconds...</p>
                </div>
                <div className="space-y-3">
                  <Link href="/login">
                    <Button className="w-full bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white">Sign In Now</Button>
                  </Link>
                  <Link href="/">
                    <Button
                      variant="outline"
                      className="w-full border-[#5e4b3a] text-[#5e4b3a] hover:bg-[#5e4b3a]/10 bg-transparent"
                    >
                      Return to Home
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {state === "error" && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#5e4b3a]">Confirmation Failed</h3>
                  <p className="text-sm text-red-600">{message}</p>
                </div>
                <div className="space-y-3">
                  <Link href="/register">
                    <Button className="w-full bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white">
                      Try Registration Again
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button
                      variant="outline"
                      className="w-full border-[#5e4b3a] text-[#5e4b3a] hover:bg-[#5e4b3a]/10 bg-transparent"
                    >
                      Return to Home
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {state === "expired" && (
              <>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="h-8 w-8 text-orange-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#5e4b3a]">Link Expired</h3>
                  <p className="text-sm text-orange-600">{message}</p>
                </div>
                <div className="space-y-3">
                  {userEmail && (
                    <Button onClick={resendConfirmation} className="w-full bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white">
                      Resend Confirmation Email
                    </Button>
                  )}
                  <Link href="/register">
                    <Button
                      variant="outline"
                      className="w-full border-[#5e4b3a] text-[#5e4b3a] hover:bg-[#5e4b3a]/10 bg-transparent"
                    >
                      Register Again
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
