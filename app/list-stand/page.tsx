
"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, MapPin, Upload, CheckCircle, Loader2, Camera } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"

interface LocationData {
  latitude: number
  longitude: number
  address: string
  isGPSLocation: boolean
}

interface FormData {
  // Step 1: Location
  location: LocationData | null
  
  // Step 2: Photos
  photos: File[]
  
  // Step 3: Wood Quality & Details
  standName: string
  woodQuality: string
  priceRange: string
  paymentMethods: string[]
  otherPaymentMethod: string
  additionalDetails: string
  onsitePerson: boolean
  
  // Step 4: Contact
  yourName: string
  email: string
  phone: string
  isOwner: boolean
}

const INITIAL_FORM_DATA: FormData = {
  location: null,
  photos: [],
  standName: "",
  woodQuality: "",
  priceRange: "",
  paymentMethods: [],
  otherPaymentMethod: "",
  additionalDetails: "",
  onsitePerson: false,
  yourName: "",
  email: "",
  phone: "",
  isOwner: false
}

export default function ListStandPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Step 1 - Location states
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle')
  const [mapReady, setMapReady] = useState(false)
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [addressInput, setAddressInput] = useState("")

  useEffect(() => {
    // Check authentication
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [])

  // Initialize map for Step 1
  useEffect(() => {
    if (currentStep === 1 && !mapReady) {
      initializeMap()
    }
  }, [currentStep])

  const initializeMap = async () => {
    if (typeof window === "undefined") return

    try {
      // Load Leaflet CSS and JS if not already loaded
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      if (!window.L) {
        await new Promise((resolve) => {
          const script = document.createElement("script")
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          script.onload = () => resolve(null)
          document.head.appendChild(script)
        })
      }

      await new Promise(resolve => setTimeout(resolve, 100))

      const mapContainer = document.getElementById("location-map")
      if (!mapContainer) return

      mapContainer.innerHTML = ''

      const newMap = window.L.map(mapContainer, {
        center: [42.6369, -82.7326], // Default to New Baltimore, MI
        zoom: 10,
        zoomControl: true
      })

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors'
      }).addTo(newMap)

      // Add click handler for placing pins
      newMap.on('click', (e: any) => {
        placeMarker(e.latlng.lat, e.latlng.lng, false)
      })

      setMap(newMap)
      setMapReady(true)

      // Try to get user's location
      requestUserLocation(newMap)

    } catch (error) {
      console.error("Error initializing map:", error)
    }
  }

  const requestUserLocation = (mapInstance: any) => {
    if (!navigator.geolocation) {
      setLocationStatus('denied')
      return
    }

    setLocationStatus('requesting')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        
        mapInstance.setView([lat, lng], 13)
        placeMarker(lat, lng, true)
        setLocationStatus('granted')
      },
      (error) => {
        console.warn("Geolocation error:", error)
        setLocationStatus('denied')
      },
      {
        timeout: 10000,
        enableHighAccuracy: true
      }
    )
  }

  const placeMarker = async (lat: number, lng: number, isGPS: boolean) => {
    if (!map) return

    // Remove existing marker
    if (marker) {
      map.removeLayer(marker)
    }

    // Add new marker
    const newMarker = window.L.marker([lat, lng], {
      draggable: true
    }).addTo(map)

    // Handle marker drag
    newMarker.on('dragend', (e: any) => {
      const position = e.target.getLatLng()
      updateLocationData(position.lat, position.lng, false)
    })

    setMarker(newMarker)
    
    // Get address from coordinates
    await updateLocationData(lat, lng, isGPS)
  }

  const updateLocationData = async (lat: number, lng: number, isGPS: boolean) => {
    try {
      // Use Mapbox reverse geocoding
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=address,poi`
      )
      const data = await response.json()
      
      let address = `${lat.toFixed(6)}, ${lng.toFixed(6)}` // Fallback to coordinates
      if (data.features && data.features.length > 0) {
        address = data.features[0].place_name
      }

      setFormData(prev => ({
        ...prev,
        location: {
          latitude: lat,
          longitude: lng,
          address,
          isGPSLocation: isGPS
        }
      }))
    } catch (error) {
      console.error("Error reverse geocoding:", error)
      // Fallback to coordinates
      setFormData(prev => ({
        ...prev,
        location: {
          latitude: lat,
          longitude: lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          isGPSLocation: isGPS
        }
      }))
    }
  }

  const handleAddressSearch = async () => {
    if (!addressInput.trim() || !map) return

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressInput)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=address,poi&limit=1`
      )
      const data = await response.json()
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const [lng, lat] = feature.center
        
        map.setView([lat, lng], 15)
        placeMarker(lat, lng, false)
      }
    } catch (error) {
      console.error("Error geocoding address:", error)
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit
    )
    
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...validFiles].slice(0, 5) // Max 5 photos
    }))
  }

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const generateStandName = async () => {
    if (!formData.location) return ""

    try {
      const { latitude, longitude } = formData.location
      
      // Get nearby street intersections using Mapbox
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=address&limit=5`
      )
      const data = await response.json()
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const placeName = feature.place_name
        
        // Extract city from the place name
        const parts = placeName.split(', ')
        const city = parts.length >= 2 ? parts[1] : parts[0]
        
        return `Firewood near ${city}`
      }
    } catch (error) {
      console.error("Error generating stand name:", error)
    }
    
    return "Local Firewood Stand"
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Generate stand name if empty
      const finalStandName = formData.standName.trim() || await generateStandName()

      // Upload photos to Supabase Storage
      const photoUrls: string[] = []
      for (const photo of formData.photos) {
        const fileName = `${Date.now()}-${photo.name}`
        const { data, error } = await supabase.storage
          .from('stand_photos')
          .upload(fileName, photo)
        
        if (error) {
          console.error("Error uploading photo:", error)
        } else {
          photoUrls.push(data.path)
        }
      }

      // Prepare payment methods
      const paymentMethods = [...formData.paymentMethods]
      if (formData.otherPaymentMethod.trim()) {
        paymentMethods.push(formData.otherPaymentMethod.trim())
      }

      // Prepare submission data
      const submissionData = {
        user_id: user?.id || '00000000-0000-0000-0000-000000000000', // Anonymous fallback
        stand_name: finalStandName,
        address: formData.location?.address || '',
        latitude: formData.location?.latitude || null,
        longitude: formData.location?.longitude || null,
        wood_types: [], // Empty for new flow, using wood_quality instead
        wood_quality: formData.woodQuality,
        price_range: formData.priceRange,
        payment_methods: paymentMethods,
        additional_details: formData.additionalDetails || null,
        photo_urls: photoUrls,
        onsite_person: formData.onsitePerson,
        owner_name: formData.yourName,
        owner_email: formData.email,
        contact_phone: formData.phone || null,
        is_approved: false
      }

      const { data, error } = await supabase
        .from('firewood_stands')
        .insert([submissionData])
        .select()

      if (error) {
        throw error
      }

      setSubmitSuccess(true)
    } catch (error) {
      console.error("Error submitting stand:", error)
      alert("There was an error submitting your stand. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.location
      case 2:
        return true // Photos are optional
      case 3:
        return !!(formData.woodQuality && formData.priceRange && formData.paymentMethods.length > 0)
      case 4:
        return !!(formData.yourName && formData.email)
      default:
        return false
    }
  }

  const nextStep = () => {
    if (canProceedFromStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f8f6f3] to-white flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#5e4b3a] mb-2">Stand Listed Successfully!</h2>
            <p className="text-[#5e4b3a]/80 mb-4">
              Your firewood stand has been submitted and will be reviewed before appearing on the map.
            </p>
            <Button
              onClick={() => router.push('/')}
              className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f6f3] to-white">
      {/* Header */}
      <header className="bg-[#2d5d2a] text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-2">List a Stand</h1>
          <p className="text-white/90">Help your community find affordable firewood</p>
          
          {/* Progress bar */}
          <div className="flex items-center mt-6 space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? 'bg-white text-[#2d5d2a]' : 'bg-white/20 text-white/60'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-12 h-0.5 ${
                    step < currentStep ? 'bg-white' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 py-8">
        <Card>
          <CardContent className="p-6">
            {/* Step 1: Location */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#5e4b3a] mb-2">Where is your stand located?</h2>
                  <p className="text-[#5e4b3a]/70">Pin the exact location on the map or search for an address</p>
                </div>

                {/* GPS Status */}
                {locationStatus === 'requesting' && (
                  <div className="flex items-center gap-2 text-[#2d5d2a] bg-blue-50 p-3 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Getting your location...</span>
                  </div>
                )}

                {/* Address Search */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search for an address..."
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a]"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
                  />
                  <Button
                    onClick={handleAddressSearch}
                    variant="outline"
                    className="border-[#2d5d2a] text-[#2d5d2a] hover:bg-[#2d5d2a]/10"
                  >
                    Search
                  </Button>
                </div>

                {/* Map */}
                <div className="space-y-2">
                  <div id="location-map" className="w-full h-80 rounded-lg border border-gray-200"></div>
                  <p className="text-xs text-[#5e4b3a]/60">
                    {formData.location?.isGPSLocation ? '📍 GPS location' : '📌 Manual pin'} • 
                    Click anywhere on the map to place a pin • Drag the pin to adjust
                  </p>
                </div>

                {/* Selected Location Display */}
                {formData.location && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-[#2d5d2a] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-[#2d5d2a]">Selected Location</p>
                        <p className="text-sm text-[#5e4b3a]">{formData.location.address}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Photos */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#5e4b3a] mb-2">Add photos of your stand</h2>
                  <p className="text-[#5e4b3a]/70">Photos help customers find your stand (optional but recommended)</p>
                </div>

                {/* Photo Upload */}
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#2d5d2a] transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-[#2d5d2a] mx-auto mb-2" />
                      <p className="text-[#5e4b3a] font-medium">Click to upload photos</p>
                      <p className="text-[#5e4b3a]/60 text-sm">Up to 5 photos, max 10MB each</p>
                    </label>
                  </div>

                  {/* Photo Preview */}
                  {formData.photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={() => removePhoto(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Wood Quality & Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#5e4b3a] mb-2">Tell us about your firewood</h2>
                  <p className="text-[#5e4b3a]/70">Help customers know what to expect</p>
                </div>

                {/* Stand Name */}
                <div>
                  <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                    Stand Name (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.standName}
                    onChange={(e) => setFormData(prev => ({ ...prev, standName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a]"
                    placeholder="e.g., Johnson's Firewood Stand"
                  />
                  <p className="text-xs text-[#5e4b3a]/60 mt-1">Leave blank to auto-generate based on location</p>
                </div>

                {/* Wood Quality */}
                <div>
                  <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                    Wood Quality <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.woodQuality}
                    onChange={(e) => setFormData(prev => ({ ...prev, woodQuality: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a]"
                  >
                    <option value="">Select wood quality...</option>
                    <option value="Seasoned">Seasoned (ready to burn)</option>
                    <option value="Green">Green (needs drying time)</option>
                    <option value="Mixed">Mixed (seasoned and green)</option>
                    <option value="Unknown">Unknown/Unspecified</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                    Price Range <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priceRange}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceRange: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a]"
                  >
                    <option value="">Select price range...</option>
                    <option value="Under $5">Under $5</option>
                    <option value="$5-10">$5-10</option>
                    <option value="$10-20">$10-20</option>
                    <option value="$20-50">$20-50</option>
                    <option value="$50+">$50+</option>
                    <option value="Varies">Varies</option>
                  </select>
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                    Payment Methods <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {['Cash Box', 'Venmo', 'PayPal', 'Zelle', 'Cash App'].map(method => (
                      <label key={method} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.paymentMethods.includes(method)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({ 
                                ...prev, 
                                paymentMethods: [...prev.paymentMethods, method] 
                              }))
                            } else {
                              setFormData(prev => ({ 
                                ...prev, 
                                paymentMethods: prev.paymentMethods.filter(m => m !== method) 
                              }))
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-[#5e4b3a]">{method}</span>
                      </label>
                    ))}
                  </div>
                  
                  <input
                    type="text"
                    value={formData.otherPaymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, otherPaymentMethod: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] mt-2"
                    placeholder="Other payment method..."
                  />
                </div>

                {/* Additional Details */}
                <div>
                  <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                    Additional Details (optional)
                  </label>
                  <textarea
                    value={formData.additionalDetails}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalDetails: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a]"
                    rows={3}
                    placeholder="Any special instructions, operating hours, wood types, etc."
                  />
                </div>

                {/* Onsite Person */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="onsitePerson"
                    checked={formData.onsitePerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, onsitePerson: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="onsitePerson" className="text-[#5e4b3a] cursor-pointer">
                    Someone is usually available at this location
                  </label>
                </div>
              </div>
            )}

            {/* Step 4: Contact */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#5e4b3a] mb-2">Contact Information</h2>
                  <p className="text-[#5e4b3a]/70">How should customers reach you if needed?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.yourName}
                      onChange={(e) => setFormData(prev => ({ ...prev, yourName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a]"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a]"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a]"
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* Stand Ownership */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isOwner"
                      checked={formData.isOwner}
                      onChange={(e) => setFormData(prev => ({ ...prev, isOwner: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="isOwner" className="text-[#5e4b3a] cursor-pointer font-medium">
                      This is my stand (I own/operate this firewood stand)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="border-[#2d5d2a] text-[#2d5d2a] hover:bg-[#2d5d2a]/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceedFromStep(currentStep)}
                  className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceedFromStep(currentStep) || isSubmitting}
                  className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Stand'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
