
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Truck, 
  Phone, 
  CheckCircle, 
  ArrowLeft,
  Calendar,
  User,
  Shield,
  Star,
  AlertCircle,
  Loader2,
  TreesIcon as Tree,
  Image as ImageIcon
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface StandDetails {
  id: string
  stand_name: string
  address: string
  latitude: number | null
  longitude: number | null
  wood_types: string[]
  price_range: string
  payment_methods: string[]
  additional_details: string | null
  photo_url: string | null
  photo_urls: string[] | null
  onsite_person: boolean
  is_approved: boolean
  bundled_flag: boolean
  loose_flag: boolean
  self_serve: boolean
  payment_type: string | null
  location_type: string | null
  hours_availability: string | null
  seasonal_availability: string | null
  contact_phone: string | null
  delivery_available: boolean
  submitted_by_user_id: string
  last_verified_date: string | null
  created_at: string
  updated_at: string
  owner_name: string
  owner_email: string
  verification_count: number
  recent_verifiers: Array<{
    id: string
    first_name: string
    last_name: string
    verified_at: string
    is_submitter?: boolean
  }>
  is_verified_by_community: boolean
  distance?: number
}

export default function TestStandNoAuthPage() {
  const router = useRouter()
  const [stands, setStands] = useState<any[]>([])
  const [selectedStandId, setSelectedStandId] = useState<string | null>(null)
  const [stand, setStand] = useState<StandDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [showVerifierNames, setShowVerifierNames] = useState(false)

  useEffect(() => {
    fetchAvailableStands()
  }, [])

  useEffect(() => {
    if (selectedStandId) {
      fetchStandDetails(selectedStandId)
    }
  }, [selectedStandId])

  useEffect(() => {
    if (stand?.latitude && stand?.longitude) {
      initializeMap()
    }
  }, [stand])

  const fetchAvailableStands = async () => {
    try {
      // 48047 coordinates (New Baltimore, MI area)
      const targetLat = 42.6369
      const targetLng = -82.7326

      const { data, error } = await supabase
        .from("firewood_stands")
        .select("id, stand_name, address, latitude, longitude")
        .eq("is_approved", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null)

      if (error) throw error

      // Calculate distance and sort by proximity to 48047
      const standsWithDistance = (data || []).map(stand => {
        const distance = calculateDistance(
          targetLat, 
          targetLng, 
          stand.latitude, 
          stand.longitude
        )
        return { ...stand, distance }
      }).sort((a, b) => a.distance - b.distance).slice(0, 30)

      setStands(standsWithDistance)
      if (standsWithDistance.length > 0) {
        setSelectedStandId(standsWithDistance[0].id)
      }
    } catch (error: any) {
      console.error("Error fetching stands:", error)
    }
  }

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const fetchStandDetails = async (standId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Fetch stand details
      const { data: standData, error: standError } = await supabase
        .from("firewood_stands")
        .select("*")
        .eq("id", standId)
        .single()

      if (standError) {
        throw standError
      }

      if (!standData) {
        throw new Error("Stand not found")
      }

      // Fetch owner profile separately
      let ownerProfile = null
      if (standData.submitted_by_user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", standData.submitted_by_user_id)
          .single()

        if (!profileError && profileData) {
          ownerProfile = profileData
        }
      }

      // Fetch verification data
      const { data: verificationData, error: verificationError } = await supabase
        .from("stand_verifications")
        .select("id, verified_at, user_id")
        .eq("stand_id", standId)
        .order("verified_at", { ascending: false })

      if (verificationError) {
        console.error("Error fetching verifications:", verificationError)
      }

      // Fetch profiles for verifiers separately
      const allVerifications = verificationData || []
      const recentVerifiers = []
      
      if (allVerifications.length > 0) {
        const userIds = allVerifications.slice(0, 10).map(v => v.user_id)
        const { data: verifierProfiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", userIds)

        const profileMap = new Map()
        if (verifierProfiles) {
          verifierProfiles.forEach(profile => {
            profileMap.set(profile.id, profile)
          })
        }

        allVerifications.slice(0, 10).forEach(verification => {
          const profile = profileMap.get(verification.user_id)
          if (profile) {
            recentVerifiers.push({
              id: profile.id,
              first_name: profile.first_name,
              last_name: profile.last_name,
              verified_at: verification.verified_at,
              is_submitter: verification.user_id === standData.submitted_by_user_id
            })
          }
        })
      }

      // Process verification data - exclude self-verifications for the "verified" status
      const nonSubmitterVerifications = allVerifications.filter(v => v.user_id !== standData.submitted_by_user_id)
      
      const verificationCount = allVerifications.length
      const nonSubmitterVerificationCount = nonSubmitterVerifications.length

      // Combine data
      const standDetails: StandDetails = {
        ...standData,
        owner_name: ownerProfile ? `${ownerProfile.first_name} ${ownerProfile.last_name}` : "Unknown",
        owner_email: ownerProfile?.email || "",
        verification_count: verificationCount,
        recent_verifiers: recentVerifiers,
        is_verified_by_community: nonSubmitterVerificationCount > 0
      }

      setStand(standDetails)
    } catch (error: any) {
      console.error("Error fetching stand details:", error)
      setError(error.message || "Failed to load stand details")
    } finally {
      setLoading(false)
    }
  }

  const initializeMap = async () => {
    if (!stand?.latitude || !stand?.longitude) return

    try {
      // Load Leaflet if not already loaded
      if (!window.L) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)

        await new Promise((resolve, reject) => {
          const script = document.createElement("script")
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          script.onload = () => resolve(null)
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      // Wait for DOM element
      const mapContainer = document.getElementById("stand-map")
      if (!mapContainer) return

      // Initialize map
      const map = window.L.map(mapContainer).setView([stand.latitude, stand.longitude], 15)

      // Add tile layer
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      // Add marker
      const customIcon = window.L.divIcon({
        html: `
          <div style="
            background-color: #2d5d2a;
            width: 24px;
            height: 24px;
            border-radius: 50% 50% 50% 0;
            border: 3px solid white;
            transform: rotate(-45deg);
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">
            <div style="
              width: 10px;
              height: 10px;
              background-color: white;
              border-radius: 50%;
              position: absolute;
              top: 4px;
              left: 4px;
            "></div>
          </div>
        `,
        className: "custom-div-icon",
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      })

      window.L.marker([stand.latitude, stand.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(stand.stand_name)

      setMapReady(true)
    } catch (error) {
      console.error("Error initializing map:", error)
    }
  }

  const getPaymentIcon = (method: string) => {
    const lowerMethod = method.toLowerCase()
    if (lowerMethod.includes("venmo")) return "💳"
    if (lowerMethod.includes("paypal")) return "💰"
    if (lowerMethod.includes("zelle")) return "⚡"
    if (lowerMethod.includes("cash")) return "💵"
    return "💳"
  }

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "")
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const getDirectionsUrl = () => {
    if (!stand?.latitude || !stand?.longitude) return "#"
    return `https://www.google.com/maps/dir/?api=1&destination=${stand.latitude},${stand.longitude}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-[#2d5d2a] mx-auto mb-4" />
          <p className="text-[#5e4b3a]">Loading stand details...</p>
        </div>
      </div>
    )
  }

  if (error || !stand) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#5e4b3a] mb-2">Stand Not Found</h1>
          <p className="text-[#5e4b3a]/80 mb-6">{error || "The requested stand could not be found."}</p>
          <Button
            onClick={() => router.push("/directory")}
            className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Directory
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Tree className="h-6 w-6 text-[#2d5d2a]" />
              <span className="text-xl font-bold text-[#2d5d2a]">FindLocalFirewood</span>
            </button>
          </div>
          <nav className="hidden md:flex gap-6">
            <button
              onClick={() => router.push("/directory")}
              className="text-[#2d5d2a] font-medium"
            >
              Directory
            </button>
            <button
              onClick={() => router.push("/list-a-stand")}
              className="text-[#5e4b3a] hover:text-[#2d5d2a] font-medium transition-colors"
            >
              List A Stand
            </button>
            <button
              onClick={() => router.push("#")}
              className="text-[#5e4b3a] hover:text-[#2d5d2a] font-medium transition-colors"
            >
              About
            </button>
          </nav>
          <div className="hidden md:flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              className="border-[#2d5d2a] text-[#2d5d2a] hover:bg-[#2d5d2a]/10 bg-transparent"
            >
              Login
            </Button>
            <Button 
              onClick={() => router.push("/register")}
              className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white"
            >
              Sign Up
            </Button>
          </div>
          <div className="md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-[#5e4b3a]"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Test Controls - Always Visible */}
        <div className="sticky top-16 z-40 mb-6">
          <Card className="bg-orange-50 border-orange-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-800 flex items-center text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                Test Mode - Non-Authenticated User Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1">
                  <p className="text-orange-700 text-sm mb-2">
                    Visitor experience (not logged in). Photo placeholder shown to demonstrate layout.
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={selectedStandId || ""}
                      onChange={(e) => setSelectedStandId(e.target.value)}
                      className="flex-1 p-2 text-sm border border-orange-300 rounded"
                    >
                      {stands.map((s, index) => (
                        <option key={s.id} value={s.id}>
                          #{index + 1} - {s.stand_name} ({s.distance?.toFixed(1)} mi)
                        </option>
                      ))}
                    </select>
                    <Badge variant="outline" className="text-orange-800 border-orange-300">
                      {stands.length} stands
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Breadcrumb */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/directory")}
            className="mb-4 border-[#2d5d2a] text-[#2d5d2a] hover:bg-[#2d5d2a]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Directory
          </Button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#5e4b3a] mb-2">
                {stand.stand_name}
              </h1>
              <div className="flex items-center gap-2 text-[#5e4b3a]/80">
                <MapPin className="h-5 w-5" />
                <span>{stand.address}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {stand.is_approved ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active Stand
                </Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Approval
                </Badge>
              )}
              {stand.is_verified_by_community && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery - Always show placeholder for demo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#5e4b3a]">Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Photo placeholder placeholders */}
                  <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Photo would appear here</p>
                      <p className="text-xs text-gray-400">when uploaded by owner</p>
                    </div>
                  </div>
                  <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Additional photos</p>
                      <p className="text-xs text-gray-400">would display here</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stand Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#5e4b3a]">Stand Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Wood Types */}
                <div>
                  <h3 className="font-semibold text-[#5e4b3a] mb-2">Available Wood Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {stand.wood_types.map((type, index) => (
                      <Badge key={index} variant="secondary" className="bg-[#f5f1e8] text-[#5e4b3a] border border-[#2d5d2a]/20">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Price & Payment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-[#5e4b3a] mb-2 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Price Range
                    </h3>
                    <p className="text-[#2d5d2a] font-medium">{stand.price_range}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#5e4b3a] mb-2">Payment Methods</h3>
                    <div className="flex flex-wrap gap-2">
                      {stand.payment_methods.map((method, index) => (
                        <span key={index} className="inline-flex items-center gap-1 text-sm bg-gray-100 px-2 py-1 rounded">
                          <span>{getPaymentIcon(method)}</span>
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Wood Format & Service */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-[#5e4b3a] mb-2">Wood Format</h3>
                    <div className="space-y-1">
                      {stand.bundled_flag && <Badge variant="outline">📦 Bundled Wood</Badge>}
                      {stand.loose_flag && <Badge variant="outline">🪵 Loose Wood</Badge>}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#5e4b3a] mb-2">Service Type</h3>
                    <div className="space-y-1">
                      {stand.self_serve && <Badge variant="outline">🛒 Self-Serve</Badge>}
                      {stand.onsite_person && <Badge variant="outline">👤 Owner Available</Badge>}
                      {stand.delivery_available && (
                        <Badge variant="outline">
                          <Truck className="h-3 w-3 mr-1" />
                          Delivery Available
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hours & Availability */}
                {(stand.hours_availability || stand.seasonal_availability) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {stand.hours_availability && (
                      <div>
                        <h3 className="font-semibold text-[#5e4b3a] mb-2 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Hours
                        </h3>
                        <p className="text-[#5e4b3a]/80">{stand.hours_availability}</p>
                      </div>
                    )}

                    {stand.seasonal_availability && (
                      <div>
                        <h3 className="font-semibold text-[#5e4b3a] mb-2 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Seasonal Availability
                        </h3>
                        <p className="text-[#5e4b3a]/80">{stand.seasonal_availability}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact */}
                {stand.contact_phone && (
                  <div>
                    <h3 className="font-semibold text-[#5e4b3a] mb-2 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Contact
                    </h3>
                    <a href={`tel:${stand.contact_phone}`} className="text-[#2d5d2a] hover:underline">
                      {formatPhoneNumber(stand.contact_phone)}
                    </a>
                  </div>
                )}

                {/* Additional Details */}
                {stand.additional_details && (
                  <div>
                    <h3 className="font-semibold text-[#5e4b3a] mb-2">Additional Details</h3>
                    <p className="text-[#5e4b3a]/80 leading-relaxed">{stand.additional_details}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Map */}
            {stand.latitude && stand.longitude && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#5e4b3a] flex items-center justify-between">
                    Location
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="border-[#2d5d2a] text-[#2d5d2a] hover:bg-[#2d5d2a]/10"
                    >
                      <a href={getDirectionsUrl()} target="_blank" rel="noopener noreferrer">
                        Get Directions ↗
                      </a>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div id="stand-map" className="w-full h-64 rounded-lg border border-gray-200"></div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Check-In */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#5e4b3a] flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Check-In
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#2d5d2a]">{stand.verification_count}</div>
                  <p className="text-sm text-[#5e4b3a]/80">total check-ins</p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => router.push("/login")}
                  className="w-full border-[#2d5d2a] text-[#2d5d2a] hover:bg-[#2d5d2a]/10"
                >
                  Check In to This Stand (Coming Soon)
                </Button>

                <p className="text-xs text-[#5e4b3a]/60 text-center">
                  Help others find great firewood stands in your community
                </p>

                {/* Last Check-In */}
                <Separator />
                <div>
                  <h4 className="font-medium text-[#5e4b3a] mb-2">Last Check-In By</h4>
                  {stand.recent_verifiers.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#5e4b3a]">
                          {stand.recent_verifiers[0].first_name} {stand.recent_verifiers[0].last_name}
                          {stand.recent_verifiers[0].is_submitter && (
                            <Badge variant="outline" className="text-xs py-0 px-1 ml-2">
                              Owner
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-[#5e4b3a]/60">
                          Checked in {new Date(stand.recent_verifiers[0].verified_at).toLocaleDateString()}
                        </p>
                        {stand.verification_count > 1 && (
                          <p className="text-xs text-[#5e4b3a]/60">
                            Total contributions: {stand.recent_verifiers.filter(v => v.id === stand.recent_verifiers[0].id).length} check-in/submission
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#5e4b3a]/60">No check-ins yet</p>
                  )}
                </div>

                {/* Submission Section */}
                <Separator />
                <div>
                  <h4 className="font-medium text-[#5e4b3a] mb-2">Stand Submitted By</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#5e4b3a]">{stand.owner_name}</p>
                      <p className="text-xs text-[#5e4b3a]/60">
                        Submitted on {new Date(stand.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-[#5e4b3a]/60">
                        Total contributions: 1 check-in/submission
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            
          </div>
        </div>
      </div>
    </div>
  )
}
