"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, TreesIcon as Tree } from "lucide-react"
import { loginUser } from "./lib/auth"

interface FormData {
  email: string
  password: string
  rememberMe: boolean
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: false,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      await loginUser({
        email: formData.email,
        password: formData.password,
      })

      // Successful login - redirect to home page
      router.push("/")
    } catch (error: any) {
      console.error("Login error:", error)

      // Handle specific Supabase errors
      if (error.message?.includes("Invalid login credentials")) {
        setErrors({ general: "Invalid email or password" })
      } else if (error.message?.includes("Email not confirmed")) {
        setErrors({ general: "Please check your email and confirm your account before signing in" })
      } else if (error.message?.includes("Too many requests")) {
        setErrors({ general: "Too many login attempts. Please try again later." })
      } else {
        setErrors({ general: error.message || "Login failed. Please try again." })
      }
    } finally {
      setIsSubmitting(false)
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
          <h2 className="text-3xl font-bold text-[#5e4b3a]">Welcome Back</h2>
          <p className="mt-2 text-sm text-[#5e4b3a]/70">Sign in to your FindLocalFirewood account</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#5e4b3a] mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] focus:border-transparent ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your email"
                autoComplete="email"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#5e4b3a] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] focus:border-transparent ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#5e4b3a]/50 hover:text-[#5e4b3a]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange("rememberMe", e.target.checked)}
                  className="w-4 h-4 text-[#2d5d2a] border-gray-300 rounded focus:ring-[#2d5d2a]"
                />
                <span className="text-sm text-[#5e4b3a]">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-[#2d5d2a] hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white h-12 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-[#5e4b3a]/70">
                Don't have an account?{" "}
                <Link href="/register" className="text-[#2d5d2a] hover:underline font-medium">
                  Create one here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
