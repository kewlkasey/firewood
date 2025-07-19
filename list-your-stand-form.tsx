"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { TreesIcon as Tree, Upload, CheckCircle } from "lucide-react"
import AddressInput from "./components/address-input"

interface AddressData {
  formattedAddress: string
  latitude: number
  longitude: number
  isValidated: boolean
}

interface FormData {
  standName: string
  yourName: string
  email: string
  phone: string
  address: AddressData | null
  woodTypes: string[]
  otherWoodType: string
  priceRange: string
  paymentMethods: string[]
  otherPaymentMethod: string
  additionalDetails: string
  photo: File | null
  onsitePerson: boolean
}

interface FormErrors {
  standName?: string
  yourName?: string
  email?: string
  address?: string
  woodTypes?: string
  priceRange?: string
  paymentMethods?: string
}

export default function ListYourStandForm() {
  // Check URL parameters on mount
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('owner') === 'true') {
      setIsOwnerStand(true)
    }
  }, [])
  const [formData, setFormData] = useState<FormData>({
    standName: "",
    yourName: "",
    email: "",
    phone: "",
    address: null,
    woodTypes: [],
    otherWoodType: "",
    priceRange: "",
    paymentMethods: [],
    otherPaymentMethod: "",
    additionalDetails: "",
    photo: null,
    onsitePerson: false,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showMoreWoodTypes, setShowMoreWoodTypes] = useState(false)
  const [isOwnerStand, setIsOwnerStand] = useState<boolean | null>(null)

  const initialWoodTypes = [
    "Ash",
    "Cherry",
    "Hickory",
    "Maple",
    "Oak",
    "Mixed Hardwood",
    "Mixed Softwood",
    "Unspecified",
  ]

  const additionalWoodTypes = [
    "Basswood",
    "Beech",
    "Birch",
    "Black Locust",
    "Cottonwood",
    "Elm",
    "Hackberry",
    "Pine",
    "Poplar",
    "Walnut",
    "Other",
  ]

  const allWoodTypes = [...initialWoodTypes, ...additionalWoodTypes]

  const priceRangeOptions = ["Under $5/bundle", "$5-10/bundle", "$10-15/bundle", "$15+/bundle", "Varies"]

  const paymentMethodOptions = ["Cash Box", "Venmo", "PayPal", "Zelle", "Other"]

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.standName.trim()) {
      newErrors.standName = "Stand name is required"
    }

    if (!formData.yourName.trim()) {
      newErrors.yourName = "Your name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.address?.formattedAddress) {
      newErrors.address = "Stand location is required"
    }

    if (formData.woodTypes.length === 0) {
      newErrors.woodTypes = "Please select at least one wood type"
    }

    if (!formData.priceRange) {
      newErrors.priceRange = "Please select a price range"
    }

    if (formData.paymentMethods.length === 0) {
      newErrors.paymentMethods = "Please select at least one payment method"
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

  const handleCheckboxChange = (field: "woodTypes" | "paymentMethods", value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked ? [...prev[field], value] : prev[field].filter((item) => item !== value),
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, photo: file }))
  }

  const handleAddressChange = (address: AddressData | null) => {
    setFormData((prev) => ({ ...prev, address }))
    // Clear address error when user selects an address
    if (address && errors.address) {
      setErrors((prev) => ({ ...prev, address: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    // Simulate API call with address data
    try {
      const submissionData = {
        ...formData,
        // Include coordinates in submission
        latitude: formData.address?.latitude,
        longitude: formData.address?.longitude,
        addressValidated: formData.address?.isValidated,
      }

      console.log("Submitting form with address data:", submissionData)

      await new Promise((resolve) => setTimeout(resolve, 2000))
      setIsSubmitted(true)
    } catch (error) {
      console.error("Submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f5f1e8] to-white">
        <div className="container max-w-2xl mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-[#2d5d2a] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#5e4b3a]">Thank You for Your Submission!</h1>
            <p className="text-lg text-[#5e4b3a]/80 max-w-md mx-auto">
              Your firewood stand listing has been received and will be reviewed within 24-48 hours. We'll contact you
              at {formData.email} once it's approved.
            </p>
            {formData.address?.isValidated && (
              <p className="text-sm text-green-600">✓ Address verified and coordinates saved for accurate mapping</p>
            )}
            <Button onClick={() => (window.location.href = "/")} className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white">
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f1e8] to-white">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Tree className="h-8 w-8 text-[#2d5d2a]" />
            <span className="text-2xl font-bold text-[#2d5d2a]">FindLocalFirewood</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#5e4b3a] mb-4">List A Firewood Stand</h1>
          <p className="text-lg text-[#5e4b3a]/80 mb-2">
            Share your stand with travelers and neighbors in your community
          </p>
          <p className="text-sm text-[#5e4b3a]/70">
            All listings are reviewed before going live to maintain quality and trust
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 md:p-8 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#5e4b3a] border-b border-[#f5f1e8] pb-2">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="standName" className="block text-sm font-medium text-[#5e4b3a] mb-2">
                  Stand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="standName"
                  value={formData.standName}
                  onChange={(e) => handleInputChange("standName", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] focus:border-transparent ${
                    errors.standName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., Johnson's Firewood Stand"
                />
                {errors.standName && <p className="text-red-500 text-sm mt-1">{errors.standName}</p>}
              </div>

              <div>
                <label htmlFor="yourName" className="block text-sm font-medium text-[#5e4b3a] mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="yourName"
                  value={formData.yourName}
                  onChange={(e) => handleInputChange("yourName", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] focus:border-transparent ${
                    errors.yourName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Your full name"
                />
                {errors.yourName && <p className="text-red-500 text-sm mt-1">{errors.yourName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#5e4b3a] mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] focus:border-transparent ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="your.email@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#5e4b3a] mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Enhanced Address Input */}
            <AddressInput value={formData.address} onChange={handleAddressChange} error={errors.address} required />

            {/* Stand Ownership Question */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="standOwnership"
                  checked={isOwnerStand === true}
                  onChange={(e) => setIsOwnerStand(e.target.checked)}
                  className="w-4 h-4 text-[#2d5d2a] border-gray-300 rounded focus:ring-[#2d5d2a]"
                />
                <label htmlFor="standOwnership" className="text-sm text-[#5e4b3a] cursor-pointer">
                  This is my stand (I own/operate this firewood stand)
                </label>
              </div>
            </div>
          </div>

          {/* Wood Types */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#5e4b3a] border-b border-[#f5f1e8] pb-2">
              Wood Types Available
            </h2>
            <p className="text-sm text-[#5e4b3a]/70">
              Select all that apply <span className="text-red-500">*</span>
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {initialWoodTypes.map((type) => (
                <label key={type} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.woodTypes.includes(type)}
                    onChange={(e) => handleCheckboxChange("woodTypes", type, e.target.checked)}
                    className="w-4 h-4 text-[#2d5d2a] border-gray-300 rounded focus:ring-[#2d5d2a]"
                  />
                  <span className="text-sm text-[#5e4b3a]">{type}</span>
                </label>
              ))}
            </div>

            {!showMoreWoodTypes && (
              <button
                type="button"
                onClick={() => setShowMoreWoodTypes(true)}
                className="text-[#2d5d2a] hover:text-[#1e3d1c] text-sm font-medium underline"
              >
                More wood types...
              </button>
            )}

            {showMoreWoodTypes && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-[#f5f1e8]">
                  {additionalWoodTypes.map((type) => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.woodTypes.includes(type)}
                        onChange={(e) => handleCheckboxChange("woodTypes", type, e.target.checked)}
                        className="w-4 h-4 text-[#2d5d2a] border-gray-300 rounded focus:ring-[#2d5d2a]"
                      />
                      <span className="text-sm text-[#5e4b3a]">{type}</span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMoreWoodTypes(false)}
                  className="text-[#2d5d2a] hover:text-[#1e3d1c] text-sm font-medium underline"
                >
                  Show fewer wood types
                </button>
              </>
            )}

            {formData.woodTypes.includes("Other") && (
              <div>
                <input
                  type="text"
                  value={formData.otherWoodType}
                  onChange={(e) => handleInputChange("otherWoodType", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] focus:border-transparent"
                  placeholder="Specify other wood types"
                />
              </div>
            )}

            {errors.woodTypes && <p className="text-red-500 text-sm">{errors.woodTypes}</p>}
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#5e4b3a] border-b border-[#f5f1e8] pb-2">Typical Price Range</h2>
            <p className="text-sm text-[#5e4b3a]/70">
              Select one <span className="text-red-500">*</span>
            </p>

            <div className="space-y-3">
              {priceRangeOptions.map((range) => (
                <label key={range} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priceRange"
                    value={range}
                    checked={formData.priceRange === range}
                    onChange={(e) => handleInputChange("priceRange", e.target.value)}
                    className="w-4 h-4 text-[#2d5d2a] border-gray-300 focus:ring-[#2d5d2a]"
                  />
                  <span className="text-sm text-[#5e4b3a]">{range}</span>
                </label>
              ))}
            </div>

            {errors.priceRange && <p className="text-red-500 text-sm">{errors.priceRange}</p>}
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#5e4b3a] border-b border-[#f5f1e8] pb-2">Payment Methods</h2>
            <p className="text-sm text-[#5e4b3a]/70">
              Select all that apply <span className="text-red-500">*</span>
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {paymentMethodOptions.map((method) => (
                <label key={method} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.paymentMethods.includes(method)}
                    onChange={(e) => handleCheckboxChange("paymentMethods", method, e.target.checked)}
                    className="w-4 h-4 text-[#2d5d2a] border-gray-300 rounded focus:ring-[#2d5d2a]"
                  />
                  <span className="text-sm text-[#5e4b3a]">{method}</span>
                </label>
              ))}
            </div>

            {formData.paymentMethods.includes("Other") && (
              <div>
                <input
                  type="text"
                  value={formData.otherPaymentMethod}
                  onChange={(e) => handleInputChange("otherPaymentMethod", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] focus:border-transparent"
                  placeholder="Specify other payment method"
                />
              </div>
            )}

            {errors.paymentMethods && <p className="text-red-500 text-sm">{errors.paymentMethods}</p>}
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#5e4b3a] border-b border-[#f5f1e8] pb-2">
              Additional Information
            </h2>

            <div>
              <label htmlFor="additionalDetails" className="block text-sm font-medium text-[#5e4b3a] mb-2">
                Additional Details (Optional)
              </label>
              <textarea
                id="additionalDetails"
                rows={4}
                value={formData.additionalDetails}
                onChange={(e) => handleInputChange("additionalDetails", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] focus:border-transparent"
                placeholder="Hours, special instructions, seasonal availability, etc."
              />
            </div>

            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-[#5e4b3a] mb-2">
                Photo Upload (Optional)
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer bg-[#f5f1e8] hover:bg-[#e8e1d4] px-4 py-2 rounded-md border border-[#2d5d2a]/20">
                  <Upload className="h-4 w-4 text-[#2d5d2a]" />
                  <span className="text-sm text-[#2d5d2a]">Choose Photo</span>
                  <input type="file" id="photo" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
                {formData.photo && <span className="text-sm text-[#5e4b3a]">{formData.photo.name}</span>}
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.onsitePerson}
                  onChange={(e) => handleInputChange("onsitePerson", e.target.checked)}
                  className="w-4 h-4 text-[#2d5d2a] border-gray-300 rounded focus:ring-[#2d5d2a]"
                />
                <span className="text-sm text-[#5e4b3a]">Someone is usually onsite to assist customers</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-[#f5f1e8]">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white h-12 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Your Stand Listing"}
            </Button>

            <p className="text-xs text-[#5e4b3a]/70 text-center mt-4">
              By submitting, you agree to our community guidelines and honor system principles
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
