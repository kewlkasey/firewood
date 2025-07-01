"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MapPin, Check, AlertTriangle, Loader2 } from "lucide-react"

interface AddressSuggestion {
  id: string
  place_name: string
  center: [number, number] // [longitude, latitude]
  place_type: string[]
}

interface AddressData {
  formattedAddress: string
  latitude: number
  longitude: number
  isValidated: boolean
}

interface AddressInputProps {
  value: AddressData | null
  onChange: (address: AddressData | null) => void
  error?: string
  required?: boolean
}

const MAPBOX_TOKEN = "pk.eyJ1Ijoia2V3bGthc2V5IiwiYSI6ImNtY2dhanIwNjBoaHYyaW11eml0YmZ5NXkifQ.vAiEp6qkeCsTqJIuO7LSww"

export default function AddressInput({ value, onChange, error, required = false }: AddressInputProps) {
  const [inputValue, setInputValue] = useState(value?.formattedAddress || "")
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isSelecting, setIsSelecting] = useState(false) // Add this to prevent blur interference

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Debug: Log current value state
  useEffect(() => {
    console.log("Address value updated:", value)
  }, [value])

  // Debounced search function
  const searchAddresses = async (query: string) => {
    console.log("Searching for:", query) // Debug log

    if (query.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)
    setApiError(null)

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
          `access_token=${MAPBOX_TOKEN}&country=US&types=address&limit=5`,
      )

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      console.log("API Response:", data) // Debug log
      setSuggestions(data.features || [])
      setShowSuggestions(true)
      setSelectedIndex(-1)
    } catch (error) {
      console.error("Address search error:", error)
      setApiError("Address validation temporarily unavailable")
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Clear current validation if user is typing
    if (value?.isValidated) {
      onChange(null)
    }

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue)
    }, 300)
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    console.log("Selecting suggestion:", suggestion) // Debug log

    setIsSelecting(true) // Prevent blur handler from interfering

    const addressData: AddressData = {
      formattedAddress: suggestion.place_name,
      latitude: suggestion.center[1],
      longitude: suggestion.center[0],
      isValidated: true,
    }

    console.log("Created address data:", addressData) // Debug log

    setInputValue(suggestion.place_name)
    onChange(addressData)
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedIndex(-1)

    // Reset selection flag after a brief delay
    setTimeout(() => {
      setIsSelecting(false)
    }, 100)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex])
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle manual entry (when user stops typing without selecting)
  const handleBlur = () => {
    // Don't process blur if user is selecting from dropdown
    if (isSelecting) {
      return
    }

    // Delay to allow suggestion clicks
    setTimeout(() => {
      if (isSelecting) return // Double check

      if (inputValue && !value?.isValidated && suggestions.length > 0) {
        // If there are suggestions and user typed exact match, auto-validate
        const exactMatch = suggestions.find(
          (suggestion) => suggestion.place_name.toLowerCase() === inputValue.toLowerCase(),
        )

        if (exactMatch) {
          handleSuggestionSelect(exactMatch)
          return
        }
      }

      if (inputValue && !value?.isValidated) {
        console.log("Setting manual entry for:", inputValue) // Debug log
        // Allow manual entry as fallback
        onChange({
          formattedAddress: inputValue,
          latitude: 0,
          longitude: 0,
          isValidated: false,
        })
      }
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }, 200)
  }

  // Handle focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  // Handle mouse down on suggestions (prevents blur)
  const handleSuggestionMouseDown = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent blur from firing
    setIsSelecting(true)
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Get validation status
  const getValidationStatus = () => {
    console.log("Getting validation status - value:", value, "inputValue:", inputValue) // Debug log

    if (!value && !inputValue) return null
    if (value?.isValidated) return "valid"
    if (inputValue && !value?.isValidated) return "unverified"
    return null
  }

  const validationStatus = getValidationStatus()
  console.log("Current validation status:", validationStatus) // Debug log

  return (
    <div className="relative">
      <label htmlFor="address" className="block text-sm font-medium text-[#5e4b3a] mb-2">
        Stand Location {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id="address"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`w-full px-4 py-3 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] focus:border-transparent ${
            error
              ? "border-red-500"
              : validationStatus === "valid"
                ? "border-green-500"
                : validationStatus === "unverified"
                  ? "border-yellow-500"
                  : "border-gray-300"
          }`}
          placeholder="Start typing your address..."
          autoComplete="off"
        />

        {/* Status Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 text-[#2d5d2a] animate-spin" />}
          {validationStatus === "valid" && <Check className="h-4 w-4 text-green-500" />}
          {validationStatus === "unverified" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
          <MapPin className="h-4 w-4 text-[#5e4b3a]/50" />
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onMouseDown={handleSuggestionMouseDown}
              onClick={() => handleSuggestionSelect(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-[#f5f1e8] focus:bg-[#f5f1e8] focus:outline-none border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? "bg-[#f5f1e8]" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[#2d5d2a] mt-1 flex-shrink-0" />
                <div>
                  <div className="text-sm text-[#5e4b3a] font-medium">{suggestion.place_name.split(",")[0]}</div>
                  <div className="text-xs text-[#5e4b3a]/70">
                    {suggestion.place_name.split(",").slice(1).join(",").trim()}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Helper Text and Errors */}
      <div className="mt-2 space-y-1">
        {!error && !apiError && (
          <p className="text-xs text-[#5e4b3a]/70">We'll verify this address for accurate mapping</p>
        )}

        {validationStatus === "valid" && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" />
            Address verified and coordinates saved
          </p>
        )}

        {validationStatus === "unverified" && (
          <p className="text-xs text-yellow-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Address not verified - please select from suggestions if available
          </p>
        )}

        {apiError && <p className="text-xs text-orange-600">{apiError} - you can still enter your address manually</p>}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  )
}
