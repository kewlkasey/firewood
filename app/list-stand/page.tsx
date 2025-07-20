
"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, MapPin, Upload, CheckCircle, Loader2, Camera } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"
import AddressInput from "@/components/address-input"

interface LocationData {
  formattedAddress: string
  latitude: number
  longitude: number
  isValidated: boolean
  isGPSLocation?: boolean
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
  selfService: boolean
  locationType: string
  inventoryLevel: string
  
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
  selfService: false,
  locationType: "",
  inventoryLevel: "",
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
  const [addressData, setAddressData] = useState<{formattedAddress: string; latitude: number; longitude: number; isValidated: boolean} | null>(null)

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

      const tileLayer = window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors'
      }).addTo(newMap)

      // Add double-click handler for pin placement
      newMap.on('dblclick', (e: any) => {
        console.log('Map double-clicked at:', e.latlng.lat, e.latlng.lng)
        placeMarker(e.latlng.lat, e.latlng.lng, false)
      })

      // Disable default double-click zoom
      newMap.doubleClickZoom.disable()

      // Wait for tiles to load and then ensure click handler is working
      tileLayer.on('load', () => {
        console.log('Tiles loaded, map ready for interaction')
        // Re-enable interactions to make sure they work
        newMap.off('dblclick')
        newMap.on('dblclick', (e: any) => {
          console.log('Map double-clicked at:', e.latlng.lat, e.latlng.lng)
          placeMarker(e.latlng.lat, e.latlng.lng, false)
        })
        newMap.doubleClickZoom.disable()
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

    // Create custom marker icon
    const customIcon = window.L.divIcon({
      html: `
        <div style="
          background-color: #2d5d2a;
          width: 20px;
          height: 20px;
          border-radius: 50% 50% 50% 0;
          border: 3px solid white;
          transform: rotate(-45deg);
          box-shadow: 0 3px 6px rgba(0,0,0,0.3);
          cursor: grab;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background-color: white;
            border-radius: 50%;
            position: absolute;
            top: 3px;
            left: 3px;
          "></div>
        </div>
      `,
      className: "custom-marker-icon",
      iconSize: [20, 20],
      iconAnchor: [10, 20]
    })

    // Add new marker with custom icon
    const newMarker = window.L.marker([lat, lng], {
      draggable: true,
      icon: customIcon
    }).addTo(map)

    // Handle marker drag start
    newMarker.on('dragstart', (e: any) => {
      const markerElement = e.target.getElement()
      if (markerElement) {
        markerElement.style.cursor = 'grabbing'
      }
    })

    // Handle marker drag
    newMarker.on('drag', (e: any) => {
      // Visual feedback during drag
      const position = e.target.getLatLng()
      // Could add live coordinate display here if needed
    })

    // Handle marker drag end
    newMarker.on('dragend', (e: any) => {
      const position = e.target.getLatLng()
      const markerElement = e.target.getElement()
      if (markerElement) {
        markerElement.style.cursor = 'grab'
      }
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

      const locationData = {
        formattedAddress: address,
        latitude: lat,
        longitude: lng,
        isValidated: data.features && data.features.length > 0,
        isGPSLocation: isGPS
      }

      setFormData(prev => ({
        ...prev,
        location: locationData
      }))

      // Also update addressData for the AddressInput component
      setAddressData({
        formattedAddress: address,
        latitude: lat,
        longitude: lng,
        isValidated: data.features && data.features.length > 0
      })
    } catch (error) {
      console.error("Error reverse geocoding:", error)
      // Fallback to coordinates
      const fallbackData = {
        formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        latitude: lat,
        longitude: lng,
        isValidated: false,
        isGPSLocation: isGPS
      }

      setFormData(prev => ({
        ...prev,
        location: fallbackData
      }))

      setAddressData({
        formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        latitude: lat,
        longitude: lng,
        isValidated: false
      })
    }
  }

  const handleAddressChange = (addressInput: {formattedAddress: string; latitude: number; longitude: number; isValidated: boolean} | null) => {
    setAddressData(addressInput)
    
    if (addressInput && addressInput.latitude && addressInput.longitude && map) {
      // Update map view and place marker
      map.setView([addressInput.latitude, addressInput.longitude], 15)
      placeMarker(addressInput.latitude, addressInput.longitude, false)
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
        address: formData.location?.formattedAddress || '',
        latitude: formData.location?.latitude || null,
        longitude: formData.location?.longitude || null,
        wood_types: [], // Empty for new flow, using wood_quality instead
        wood_quality: formData.woodQuality || null,
        price_range: formData.priceRange || null,
        payment_methods: paymentMethods,
        additional_details: formData.additionalDetails || null,
        photo_urls: photoUrls,
        onsite_person: formData.onsitePerson,
        self_serve: formData.selfService,
        location_type: formData.locationType || null,
        // Note: inventory_level would need to be added to database schema if it doesn't exist
        owner_name: formData.yourName || null,
        owner_email: formData.email || null,
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
        return true // All fields are optional
      case 4:
        return true // All fields are optional
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
              The firewood stand has been submitted and will be reviewed before appearing on the map.
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
          <div className="mt-6">
            <div className="flex items-center space-x-4">
              {[
                { num: 1, name: "Location" },
                { num: 2, name: "Photo" },
                { num: 3, name: "Stand Details" },
                { num: 4, name: "Contact" }
              ].map((step) => (
                <div key={step.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.num <= currentStep ? 'bg-white text-[#2d5d2a]' : 'bg-white/20 text-white/60'
                    }`}>
                      {step.num}
                    </div>
                    <span className={`text-xs mt-1 ${
                      step.num <= currentStep ? 'text-white' : 'text-white/60'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  {step.num < 4 && (
                    <div className={`w-12 h-0.5 mb-4 ${
                      step.num < currentStep ? 'bg-white' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
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
                  <h2 className="text-2xl font-bold text-[#5e4b3a] mb-2">Where is the stand located?</h2>
                  <p className="text-[#5e4b3a]/70">We'll help people in the community find it! Just drop a pin on the map or let us use your current location.</p>
                </div>

                {/* GPS Status */}
                {locationStatus === 'requesting' && (
                  <div className="flex items-center gap-2 text-[#2d5d2a] bg-blue-50 p-3 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Getting your location...</span>
                  </div>
                )}

                {/* Primary Instructions */}
                <div className="bg-[#2d5d2a]/5 border border-[#2d5d2a]/20 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-[#2d5d2a] mb-2 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    How to set your location:
                  </h3>
                  <div className="space-y-1 text-sm text-[#5e4b3a]">
                    <p className="font-medium">1. 📍 Double-click anywhere on the map to drop a pin</p>
                    <p className="font-medium">2. 🔄 Drag the pin to adjust the exact location</p>
                    <p className="text-[#5e4b3a]/70">or use the address search below if you prefer</p>
                  </div>
                </div>

                {/* Map */}
                <div className="space-y-3">
                  <div id="location-map" className="w-full h-80 rounded-lg border-2 border-[#2d5d2a]/20 hover:border-[#2d5d2a]/40 transition-colors cursor-crosshair"></div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-[#2d5d2a] font-medium text-center">
                      {formData.location?.isGPSLocation ? '📍 Using current GPS location' : 
                       formData.location ? '📌 Pin placed manually' : 
                       '👆 Double-click anywhere on the map above to place the pin'}
                    </p>
                  </div>
                </div>

                {/* Address Search (Secondary Option) */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#5e4b3a]">Alternative: Search by address</p>
                  <AddressInput 
                    value={addressData}
                    onChange={handleAddressChange}
                  />
                </div>

                {/* Selected Location Display */}
                {formData.location && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-[#2d5d2a] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-[#2d5d2a]">Selected Location</p>
                        <p className="text-sm text-[#5e4b3a]">{formData.location.formattedAddress}</p>
                        {formData.location.isValidated && (
                          <p className="text-xs text-green-600">✓ Address verified</p>
                        )}
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
                  <h2 className="text-2xl font-bold text-[#5e4b3a] mb-2">Show people what to expect!</h2>
                  <p className="text-[#5e4b3a]/70">A quick photo helps folks spot the stand when they arrive. You can always add more later.</p>
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
                  <h2 className="text-2xl font-bold text-[#5e4b3a] mb-2">Tell us about the stand</h2>
                  <p className="text-[#5e4b3a]/70">The more details you share, the easier it is for customers to know what the stand is offering. Don't worry - everything here is optional!</p>
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

                {/* Location Type */}
                <div>
                  <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                    Location Type (optional)
                  </label>
                  <select
                    value={formData.locationType}
                    onChange={(e) => setFormData(prev => ({ ...prev, locationType: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a]"
                  >
                    <option value="">Select location type...</option>
                    <option value="Roadside">Roadside</option>
                    <option value="Driveway">Driveway</option>
                    <option value="Farm">Farm</option>
                    <option value="Business">Business</option>
                    <option value="Residence">Residence</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Wood Quality */}
                <div>
                  <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                    Wood Quality (optional)
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

                {/* Inventory Level */}
                <div>
                  <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                    Current Inventory Level (optional)
                  </label>
                  <div className="space-y-2">
                    {['Fully Stocked', 'Well Stocked', 'Some Available', 'Low Stock', 'Out of Stock'].map(level => (
                      <label key={level} className="flex items-center">
                        <input
                          type="radio"
                          name="inventoryLevel"
                          value={level}
                          checked={formData.inventoryLevel === level}
                          onChange={(e) => setFormData(prev => ({ ...prev, inventoryLevel: e.target.value }))}
                          className="mr-2"
                        />
                        <span className="text-[#5e4b3a]">{level}</span>
                      </label>
                    ))}
                    {formData.inventoryLevel && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, inventoryLevel: '' }))}
                        className="text-sm text-[#2d5d2a] hover:underline"
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                    Price Range (optional)
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
                    Payment Methods (select at least one if adding payment info)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                        <span className="text-[#5e4b3a] text-sm">{method}</span>
                      </label>
                    ))}
                  </div>
                  
                  <input
                    type="text"
                    value={formData.otherPaymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, otherPaymentMethod: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] mt-3"
                    placeholder="Other payment method..."
                  />
                </div>

                {/* Service Type Options */}
                <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
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
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="selfService"
                      checked={formData.selfService}
                      onChange={(e) => setFormData(prev => ({ ...prev, selfService: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="selfService" className="text-[#5e4b3a] cursor-pointer">
                      This is mostly/always a self-service location
                    </label>
                  </div>
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
              </div>
            )}

            {/* Step 4: Contact */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#5e4b3a] mb-2">How can customers reach the owner?</h2>
                  <p className="text-[#5e4b3a]/70">Share contact info so people can ask questions or let the owner know they're stopping by. All fields are optional.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                      Owner's Name (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.yourName}
                      onChange={(e) => setFormData(prev => ({ ...prev, yourName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a]"
                      placeholder="Owner's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                      Owner's Email (optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d2a]"
                      placeholder="owner@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                    Owner's Phone Number (optional)
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
                  {user ? (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isOwner"
                        checked={formData.isOwner}
                        onChange={(e) => setFormData(prev => ({ ...prev, isOwner: e.target.checked }))}
                        className="mr-2"
                      />
                      <label htmlFor="isOwner" className="text-[#5e4b3a] cursor-pointer font-medium">
                        I own/operate this firewood stand
                      </label>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id="isOwner"
                          checked={false}
                          disabled={true}
                          className="mr-2 opacity-50"
                        />
                        <label className="text-[#5e4b3a]/60 font-medium">
                          I own/operate this firewood stand
                        </label>
                      </div>
                      <p className="text-sm text-[#5e4b3a]/70">
                        You must be logged in to claim ownership of a stand. You can claim this stand after submission by logging in and visiting the stand page.
                      </p>
                    </div>
                  )}
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
