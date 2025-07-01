"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, TreesIcon as Tree, Mail } from "lucide-react"
import { registerUser } from "./lib/auth"

interface FormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
  agreeToTerms?: string
  general?: string
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
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
      await registerUser({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      })

      setIsRegistered(true)
    } catch (error: any) {
      console.error("Registration error:", error)

      // Handle specific Supabase errors
      if (error.message?.includes("User already registered")) {
        setErrors({ general: "An account with this email already exists" })
      } else if (error.message?.includes("Password should be at least")) {
        setErrors({ password: "Password must be at least 6 characters long" })
      } else if (error.message?.includes("Invalid email")) {
        setErrors({ email: "Please enter a valid email address" })
      } else {
        setErrors({ general: error.message || "Registration failed. Please try again." })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f5f1e8] to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="flex items-center justify-center gap-2 mb-6">
              <Tree className="h-8 w-8 text-[#2d5d2a]" />
              <span className="text-2xl font-bold text-[#2d5d2a]">FindLocalFirewood</span>
            </Link>
            <h2 className="text-3xl font-bold text-[#5e4b3a]">Check Your Email!</h2>
            <p className="mt-2 text-sm text-[#5e4b3a]/70">Account created successfully</p>
          </div>

          {/* Success Content */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-[#2d5d2a] rounded-full flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-[#5e4b3a]">Confirmation Email Sent!</h3>
                <p className="text-sm text-[#5e4b3a]/70">
                  We've sent a confirmation email to <strong>{formData.email}</strong>. Please check your inbox and
                  click the confirmation link to activate your account.
                </p>
                <div className="bg-[#f5f1e8] p-4 rounded-md mt-4">
                  <p className="text-xs text-[#5e4b3a]/80">
                    <strong>Don't see the email?</strong> Check your spam folder or wait a few minutes for it to arrive.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="w-full border-[#2d5d2a] text-[#2d5d2a] hover:bg-[#2d5d2a]/10 bg-transparent"
                  >
                    Already confirmed? Sign In
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
            </div>
          </div>
        </div>
      </div>
    )
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
          <h2 className="text-3xl font-bold text-[#5e4b3a]">Create Your Account</h2>
          <p className="mt-2 text-sm text-[#5e4b3a]/70">Join the FindLocalFirewood community</p>
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

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-[#5e4b3a] mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] focus:border-transparent ${
                    errors.firstName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="John"
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-[#5e4b3a] mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] focus:border-transparent ${
                    errors.lastName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Smith"
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#5e4b3a] mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] focus:border-transparent ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#5e4b3a] mb-2">
                Password <span className="text-red-500">*</span>
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
                  placeholder="Create a strong password"
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
              <p className="text-xs text-[#5e4b3a]/70 mt-1">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#5e4b3a] mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] focus:border-transparent ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#5e4b3a]/50 hover:text-[#5e4b3a]"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Terms Agreement */}
            <div>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleInputChange("agreeToTerms", e.target.checked)}
                  className="w-4 h-4 text-[#2d5d2a] border-gray-300 rounded focus:ring-[#2d5d2a] mt-1"
                />
                <span className="text-sm text-[#5e4b3a]">
                  I agree to the{" "}
                  <Link href="/terms" className="text-[#2d5d2a] hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[#2d5d2a] hover:underline">
                    Privacy Policy
                  </Link>
                  , and I understand that FindLocalFirewood operates on an honor system for community trust.{" "}
                  <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.agreeToTerms && <p className="text-red-500 text-sm mt-1">{errors.agreeToTerms}</p>}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white h-12 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-[#5e4b3a]/70">
                Already have an account?{" "}
                <Link href="/login" className="text-[#2d5d2a] hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
