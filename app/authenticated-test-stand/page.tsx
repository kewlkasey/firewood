
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Truck, 
  Phone, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  Calendar,
  Users,
  Shield,
  Star,
  AlertCircle,
  Loader2,
  TreesIcon as Tree,
  User,
  Camera,
  Upload,
  X,
  MapPinIcon
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"

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
  inventory_level: string | null
}

interface VerificationFormData {
  notes: string
}

export default function AuthenticatedTestStandPage() {
  const router = useRouter()
  const standId = "60ef2396-26ff-4a80-b77c-e9edfcd454cc" // Fixed test stand ID

  const [stand, setStand] = useState<StandDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [submittingVerification, setSubmittingVerification] = useState(false)
  const [verificationForm, setVerificationForm] = useState<VerificationFormData>({ notes: "" })
  const [mapReady, setMapReady] = useState(false)
  const [showVerifierNames, setShowVerifierNames] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [checkInData, setCheckInData] = useState({
    inventoryLevel: '',
    paymentMethods: [] as string[],
    photos: [] as File[],
    suggestedPrimaryPhoto: null as File | null,
    notes: '',
    anonymousName: '',
    location: null as { latitude: number; longitude: number } | null
  })
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false)
  const [checkInCount, setCheckInCount] = useState(0)
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([])

  useEffect(() => {
    fetchStandDetails()
    fetchCurrentUser()
    fetchRecentCheckIns()
  }, [])

  useEffect(() => {
    if (user) {
      checkDailyCheckInCount()
    }
  }, [user])

  const checkDailyCheckInCount = async () => {
    if (!user) return
    
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('stand_verifications')
      .select('id')
      .eq('user_id', user.id)
      .gte('verified_at', today)
      .lt('verified_at', new Date(Date.now() + 86400000).toISOString().split('T')[0])

    if (!error && data) {
      setCheckInCount(data.length)
    }
  }

  const fetchRecentCheckIns = async () => {
    const { data, error } = await supabase
      .from('stand_verifications')
      .select(`
        id,
        verified_at,
        verification_notes,
        inventory_level,
        confirmed_payment_methods,
        anonymous_name,
        user_id,
        profiles:user_id (
          first_name,
          last_name
        )
      `)
      .eq('stand_id', standId)
      .order('verified_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      setRecentCheckIns(data)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Error fetching user:", error)
      // For this test page, we'll create a mock authenticated user
      setUser({
        id: "test-user-123",
        email: "test@example.com",
        first_name: "Test",
        last_name: "User"
      })
    }
  }

  const fetchStandDetails = async () => {
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

  const normalizePaymentMethod = (method: string) => {
    // Convert "Cash Box" to "Cash" for display
    if (method.toLowerCase().includes("cash")) return "Cash"
    return method
  }

  const getPaymentIcon = (method: string) => {
    const lowerMethod = method.toLowerCase()
    if (lowerMethod.includes("venmo")) return "📱"
    if (lowerMethod.includes("paypal")) return "🌐"
    if (lowerMethod.includes("zelle")) return "⚡"
    if (lowerMethod.includes("cash")) return "💵"
    if (lowerMethod.includes("check")) return "📄"
    if (lowerMethod.includes("credit") || lowerMethod.includes("card")) return "💳"
    return "💳"
  }

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "")
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const getInventoryLevelBadge = (level: string | null) => {
    if (!level) return null

    const levelConfig = {
      'High': { color: 'bg-green-100 text-green-800 border-green-200', icon: '🟢' },
      'Medium': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🟡' },
      'Low': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '🟠' },
      'None': { color: 'bg-red-100 text-red-800 border-red-200', icon: '🔴' }
    }

    const config = levelConfig[level as keyof typeof levelConfig]
    if (!config) return null

    const displayLevel = level === 'None' ? 'Empty' : level

    return (
      <Badge className={config.color}>
        <span className="mr-1">{config.icon}</span>
        {displayLevel} Stock
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-[#2d5d2a] mx-auto mb-4" />
          <p className="text-[#5e4b3a]">Loading authenticated test stand...</p>
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
          <div className="flex items-center gap-4">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <User className="h-3 w-3 mr-1" />
              Authenticated as {user?.first_name || 'Test User'}
            </Badge>
            <nav className="hidden md:flex gap-6">
              <button
                onClick={() => router.push("/directory")}
                className="text-[#2d5d2a] font-medium"
              >
                Directory
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with Test Badge */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push("/directory")}
              className="border-[#2d5d2a] text-[#2d5d2a] hover:bg-[#2d5d2a]/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Directory
            </Button>
            
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              🧪 Authenticated Test Page
            </Badge>
          </div>

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

            <div className="flex gap-2 items-center">
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
              {getInventoryLevelBadge(stand.inventory_level)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stand Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#5e4b3a]">Stand Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                          {normalizePaymentMethod(method)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                {stand.additional_details && (
                  <div>
                    <h3 className="font-semibold text-[#5e4b3a] mb-2">Additional Details</h3>
                    <p className="text-[#5e4b3a]/80 leading-relaxed">{stand.additional_details}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Check-Ins */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#5e4b3a] flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Recent Check-Ins ({recentCheckIns.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentCheckIns.length > 0 ? (
                  <div className="space-y-4">
                    {recentCheckIns.map((checkIn, index) => (
                      <div key={checkIn.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#5e4b3a]">
                                {checkIn.profiles?.first_name && checkIn.profiles?.last_name 
                                  ? `${checkIn.profiles.first_name} ${checkIn.profiles.last_name}`
                                  : checkIn.anonymous_name || 'Anonymous'
                                }
                              </p>
                              <p className="text-xs text-[#5e4b3a]/70">
                                {new Date(checkIn.verified_at).toLocaleDateString()} at {new Date(checkIn.verified_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          {checkIn.inventory_level && getInventoryLevelBadge(checkIn.inventory_level)}
                        </div>
                        
                        {checkIn.confirmed_payment_methods && checkIn.confirmed_payment_methods.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-[#5e4b3a]/70 mb-1">Confirmed payment methods:</p>
                            <div className="flex flex-wrap gap-1">
                              {checkIn.confirmed_payment_methods.map((method: string, idx: number) => (
                                <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center">
                                  <span className="mr-1">{getPaymentIcon(method)}</span>
                                  {normalizePaymentMethod(method)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {checkIn.verification_notes && (
                          <p className="text-sm text-[#5e4b3a]/80 italic">
                            "{checkIn.verification_notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-[#5e4b3a]/60">No check-ins yet</p>
                    <p className="text-sm text-[#5e4b3a]/50">Be the first to check in and help the community!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Authenticated User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#5e4b3a] flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Authenticated User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium text-[#5e4b3a]">{user?.first_name} {user?.last_name}</p>
                  <p className="text-sm text-[#5e4b3a]/70">{user?.email}</p>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Logged In
                  </Badge>
                  <p className="text-xs text-[#5e4b3a]/60 mt-3">
                    Daily check-ins: {checkInCount}/10
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Check-In Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#2d5d2a] flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Check-In
                </h2>
                {stand.is_verified_by_community && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Community Verified</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Total Check-Ins Counter */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-4 w-4 mr-2 text-[#5e4b3a]" />
                    <span className="text-lg font-semibold text-[#2d5d2a]">
                      {stand.verification_count}
                    </span>
                    <span className="text-sm text-[#5e4b3a]/80 ml-1">total check-ins</span>
                  </div>
                </div>

                {/* Check In Button */}
                <Button
                  onClick={() => {
                    // Initialize payment methods with current stand methods (normalized)
                    const normalizedPaymentMethods = stand.payment_methods.map(method => normalizePaymentMethod(method))
                    setCheckInData(prev => ({
                      ...prev,
                      paymentMethods: normalizedPaymentMethods
                    }))
                    setShowCheckInModal(true)
                  }}
                  disabled={checkInCount >= 10}
                  className="w-full bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white disabled:bg-gray-400"
                >
                  {checkInCount >= 10 ? 'Daily Limit Reached' : 'Check In to This Stand'}
                </Button>

                <p className="text-xs text-[#5e4b3a]/60 text-center">
                  Help others find great firewood stands in your community
                </p>

                {/* Last Check-In User */}
                {stand.recent_verifiers.length > 0 ? (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-[#5e4b3a] mb-2">Last Check-In By</h3>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#5e4b3a]">
                          {stand.recent_verifiers[0].first_name} {stand.recent_verifiers[0].last_name}
                        </div>
                        <div className="text-xs text-[#5e4b3a]/70">
                          Checked in on {new Date(stand.recent_verifiers[0].verified_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-[#5e4b3a] mb-2">Last Check-In By</h3>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-[#5e4b3a]/60">No check-ins yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stand Owner */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#5e4b3a] flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Stand Owner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-[#5e4b3a]">{stand.owner_name}</p>
                <p className="text-sm text-[#5e4b3a]/60">
                  Listed {new Date(stand.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Test Check-In Modal - Simplified for testing */}
      <Dialog open={showCheckInModal} onOpenChange={setShowCheckInModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#2d5d2a]">
              Test Check-In
            </DialogTitle>
            <DialogDescription className="text-[#5e4b3a]/80">
              This is a test check-in modal for the authenticated experience.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Authenticated User Check-In</h3>
              <p className="text-sm text-blue-700">
                Logged in as: {user?.first_name} {user?.last_name}
              </p>
              <p className="text-sm text-blue-700">
                Daily check-ins: {checkInCount}/10
              </p>
            </div>

            <div className="text-center">
              <Button
                onClick={() => {
                  setShowCheckInModal(false)
                  alert('Test check-in completed! This would submit a real check-in in the production app.')
                }}
                className="w-full bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white"
              >
                Submit Test Check-In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
