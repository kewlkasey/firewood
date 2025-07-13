
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
  const params = useParams()
  const router = useRouter()
  const standId = params?.id as string

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
    if (standId) {
      fetchStandDetails()
      fetchCurrentUser()
      fetchRecentCheckIns()
    }
  }, [standId])

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
        user_id
      `)
      .eq('stand_id', standId)
      .order('verified_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      console.log('Recent check-ins raw data:', data)
      
      // Fetch profile data separately for users with user_id
      const checkInsWithProfiles = await Promise.all(
        data.map(async (checkIn) => {
          if (checkIn.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', checkIn.user_id)
              .single()
            
            return {
              ...checkIn,
              profiles: profile
            }
          }
          return {
            ...checkIn,
            profiles: null
          }
        })
      )
      
      console.log('Recent check-ins with profiles:', checkInsWithProfiles)
      setRecentCheckIns(checkInsWithProfiles)
    } else {
      console.error('Error fetching recent check-ins:', error)
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

      // Fetch verification data including anonymous check-ins
      const { data: verificationData, error: verificationError } = await supabase
        .from("stand_verifications")
        .select("id, verified_at, user_id, anonymous_name")
        .eq("stand_id", standId)
        .order("verified_at", { ascending: false })

      if (verificationError) {
        console.error("Error fetching verifications:", verificationError)
      }

      // Fetch profiles for verifiers separately and include anonymous users
      const allVerifications = verificationData || []
      const recentVerifiers = []

      if (allVerifications.length > 0) {
        const userIds = allVerifications.slice(0, 10).map(v => v.user_id).filter(Boolean)
        let profileMap = new Map()
        
        if (userIds.length > 0) {
          const { data: verifierProfiles } = await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .in("id", userIds)

          if (verifierProfiles) {
            verifierProfiles.forEach(profile => {
              profileMap.set(profile.id, profile)
            })
          }
        }

        allVerifications.slice(0, 10).forEach(verification => {
          if (verification.user_id) {
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
          } else {
            // Include anonymous check-ins
            recentVerifiers.push({
              id: `anonymous-${verification.id}`,
              first_name: verification.anonymous_name || 'Anonymous',
              last_name: '',
              verified_at: verification.verified_at,
              is_submitter: false
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

  const requestLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCheckInData(prev => ({
            ...prev,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          }))
          setLocationPermission('granted')
        },
        () => {
          setLocationPermission('denied')
        }
      )
    } else {
      setLocationPermission('denied')
    }
  }

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Target dimensions: max 1200px width/height
        const maxDimension = 1200
        let { width, height } = img
        
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width
          width = maxDimension
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height
          height = maxDimension
        }
        
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })
          resolve(compressedFile)
        }, 'image/jpeg', 0.8)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 2MB.`)
        continue
      }
      
      if (checkInData.photos.length >= 5) {
        alert('Maximum 5 photos allowed per check-in.')
        break
      }
      
      const compressedFile = await compressImage(file)
      setCheckInData(prev => ({
        ...prev,
        photos: [...prev.photos, compressedFile]
      }))
    }
  }

  const removePhoto = (index: number) => {
    setCheckInData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
      suggestedPrimaryPhoto: prev.suggestedPrimaryPhoto === prev.photos[index] ? null : prev.suggestedPrimaryPhoto
    }))
  }

  const setSuggestedPrimary = (photo: File) => {
    setCheckInData(prev => ({
      ...prev,
      suggestedPrimaryPhoto: photo
    }))
  }

  const handlePaymentMethodToggle = (method: string) => {
    setCheckInData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter(m => m !== method)
        : [...prev.paymentMethods, method]
    }))
  }

  const uploadPhotosToStorage = async (photos: File[]): Promise<string[]> => {
    const uploadedUrls = []
    
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('stand_photos')
        .upload(filePath, photo)
      
      if (uploadError) {
        console.error('Error uploading photo:', uploadError)
        continue
      }
      
      uploadedUrls.push(filePath)
    }
    
    return uploadedUrls
  }

  const submitCheckIn = async () => {
    if (user && checkInCount >= 10) {
      alert('You have reached the daily limit of 10 check-ins.')
      return
    }

    if (!checkInData.inventoryLevel) {
      alert('Please select an inventory level.')
      return
    }

    try {
      setSubmittingCheckIn(true)

      // Map inventory levels to match database schema
      const inventoryLevelMapping = {
        'Full': 'High',
        'Low': 'Low', 
        'Empty': 'None'
      }
      
      const mappedInventoryLevel = inventoryLevelMapping[checkInData.inventoryLevel as keyof typeof inventoryLevelMapping] || checkInData.inventoryLevel

      // Upload photos if any
      let photoUrls: string[] = []
      let suggestedPrimaryUrl: string | null = null
      
      if (checkInData.photos.length > 0) {
        photoUrls = await uploadPhotosToStorage(checkInData.photos)
        
        if (checkInData.suggestedPrimaryPhoto) {
          const primaryIndex = checkInData.photos.indexOf(checkInData.suggestedPrimaryPhoto)
          if (primaryIndex !== -1 && photoUrls[primaryIndex]) {
            suggestedPrimaryUrl = photoUrls[primaryIndex]
          }
        }
      }

      // Insert check-in record (location not retained per requirements)
      const checkInRecord = {
        stand_id: stand!.id,
        user_id: user?.id || null,
        verification_notes: checkInData.notes.trim() || null,
        inventory_level: mappedInventoryLevel,
        confirmed_payment_methods: checkInData.paymentMethods,
        photos: photoUrls,
        suggested_primary_photo: suggestedPrimaryUrl,
        anonymous_name: !user ? checkInData.anonymousName.trim() || null : null,
        check_in_location: null, // Location not retained per requirements
        verified_at: new Date().toISOString()
      }

      const { error: insertError } = await supabase
        .from('stand_verifications')
        .insert(checkInRecord)

      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }

      // Update stand inventory level and payment methods
      if (stand?.id) {
        const standUpdateData: any = { 
          inventory_level: mappedInventoryLevel,
          last_verified_date: new Date().toISOString()
        }

        // Always update payment methods with the confirmed ones from check-in
        if (checkInData.paymentMethods.length > 0) {
          standUpdateData.payment_methods = checkInData.paymentMethods
        }

        console.log('About to update stand:', stand.id)
        console.log('Update data:', standUpdateData)
        console.log('Current stand data before update:', {
          inventory_level: stand.inventory_level,
          payment_methods: stand.payment_methods
        })
        
        // First, let's try to read the current row to verify we have access
        const { data: currentStand, error: readError } = await supabase
          .from('firewood_stands')
          .select('id, inventory_level, payment_methods, last_verified_date')
          .eq('id', stand.id)
          .single()

        if (readError) {
          console.error('Cannot read current stand data:', readError)
        } else {
          console.log('Current stand data from DB:', currentStand)
        }
        
        const { data: updateResult, error: updateError } = await supabase
          .from('firewood_stands')
          .update(standUpdateData)
          .eq('id', stand.id)
          .select() // Return the updated row

        if (updateError) {
          console.error('Stand update error:', updateError)
          console.error('Failed to update stand ID:', stand.id)
          console.error('Update data was:', standUpdateData)
          console.error('Error code:', updateError.code)
          console.error('Error message:', updateError.message)
          console.error('Error details:', updateError.details)
          console.error('Error hint:', updateError.hint)
          
          // Try a simple test update to see if it's a permissions issue
          const { data: testUpdate, error: testError } = await supabase
            .from('firewood_stands')
            .update({ last_verified_date: new Date().toISOString() })
            .eq('id', stand.id)
            .select()
            
          if (testError) {
            console.error('Even simple update failed:', testError)
          } else {
            console.log('Simple update worked:', testUpdate)
          }
          
          // Don't throw here as the check-in was already saved
        } else {
          console.log('Stand updated successfully!')
          console.log('Updated stand data:', updateResult)
          
          // Verify the update actually took effect
          const { data: verifyUpdate, error: verifyError } = await supabase
            .from('firewood_stands')
            .select('inventory_level, payment_methods, last_verified_date')
            .eq('id', stand.id)
            .single()
            
          if (!verifyError && verifyUpdate) {
            console.log('Verified update in DB:', verifyUpdate)
          }
          
          // Update local state immediately with the new values
          setStand(prevStand => prevStand ? {
            ...prevStand,
            inventory_level: mappedInventoryLevel,
            payment_methods: checkInData.paymentMethods.length > 0 ? checkInData.paymentMethods : prevStand.payment_methods,
            last_verified_date: new Date().toISOString()
          } : null)
        }
      } else {
        console.error('Stand object or ID is missing, cannot update stand')
        console.error('Stand object:', stand)
      }

      // Reset form and close modal
      setCheckInData({
        inventoryLevel: '',
        paymentMethods: [],
        photos: [],
        suggestedPrimaryPhoto: null,
        notes: '',
        anonymousName: '',
        location: null
      })
      setShowCheckInModal(false)
      
      // Refresh check-ins and daily count first
      await fetchRecentCheckIns()
      if (user) await checkDailyCheckInCount()
      
      // Then refresh stand details (this will overwrite our local state update, but should now have the updated data)
      await fetchStandDetails()
      
      alert('Thank you for checking in! Your update helps the community.')
    } catch (error: any) {
      console.error('Error submitting check-in:', error)
      console.error('Error details:', error.message, error.details, error.hint)
      alert(`Failed to submit check-in: ${error.message || 'Please try again.'}`)
    } finally {
      setSubmittingCheckIn(false)
    }
  }

  useEffect(() => {
    if (stand?.latitude && stand?.longitude) {
      initializeMap()
    }
  }, [stand])

  // Keyboard navigation for photo modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return
      
      const allPhotos = []
      if (stand?.photo_urls && stand.photo_urls.length > 0) {
        allPhotos.push(...stand.photo_urls)
      } else if (stand?.photo_url) {
        allPhotos.push(stand.photo_url)
      }

      switch (e.key) {
        case 'Escape':
          setSelectedPhotoIndex(null)
          break
        case 'ArrowLeft':
          e.preventDefault()
          setSelectedPhotoIndex(selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : allPhotos.length - 1)
          break
        case 'ArrowRight':
          e.preventDefault()
          setSelectedPhotoIndex(selectedPhotoIndex < allPhotos.length - 1 ? selectedPhotoIndex + 1 : 0)
          break
      }
    }

    if (selectedPhotoIndex !== null) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedPhotoIndex, stand])

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

  const getDirectionsUrl = () => {
    if (!stand?.latitude || !stand?.longitude) return "#"
    return `https://www.google.com/maps/dir/?api=1&destination=${stand.latitude},${stand.longitude}`
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
              🧪 Authenticated Test Page - Stand ID: {standId}
            </Badge>
            
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
              ⚠️ Check-ins will be saved to database
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
                {/* Inventory Level Warning */}
                {stand.inventory_level && (stand.inventory_level === 'Low' || stand.inventory_level === 'None') && (
                  <div className={`p-4 rounded-lg border-2 ${
                    stand.inventory_level === 'None' 
                      ? 'bg-red-50 border-red-200 text-red-800' 
                      : 'bg-orange-50 border-orange-200 text-orange-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {stand.inventory_level === 'None' ? '🔴' : '🟠'}
                      </span>
                      <h3 className="font-semibold text-base">
                        {stand.inventory_level === 'None' ? 'INVENTORY EMPTY' : 'LOW INVENTORY WARNING'}
                      </h3>
                    </div>
                    <p className="text-sm">
                      {stand.inventory_level === 'None' 
                        ? 'This stand is currently out of firewood. Please contact the owner or check back later.'
                        : `This stand has limited firewood available.${stand.contact_phone ? ' Consider calling ahead to confirm availability.' : ' Availability may be limited.'}`
                      }
                    </p>
                  </div>
                )}

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
                            <div className="w-8 h-8 bg-[#2d5d2a] text-white rounded-full flex items-center justify-center text-xs font-bold">
                              TU
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
                    <div className="w-12 h-12 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                      TU
                    </div>
                    <p className="text-[#5e4b3a]/60">No check-ins yet</p>
                    <p className="text-sm text-[#5e4b3a]/50">Be the first to check in and help the community!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                      {stand.verification_count + 1}
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
                      <div className="w-8 h-8 bg-[#2d5d2a] text-white rounded-full flex items-center justify-center text-xs font-bold">
                        TU
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

                {/* Stand Submitter Info */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-[#5e4b3a] mb-2">Stand Submitted By</h3>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-[#2d5d2a] text-white rounded-full flex items-center justify-center text-xs font-bold">
                      TU
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#5e4b3a]">
                        {stand.owner_name}
                      </div>
                      <div className="text-xs text-[#5e4b3a]/70">
                        Submitted on {new Date(stand.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-[#5e4b3a]/60">
                        Total contributions: 1 check-in/submission
                      </div>
                    </div>
                  </div>
                </div>
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

      {/* Navigation to Normal Stand Page */}
        <div className="max-w-6xl mx-auto px-4 pb-8">
          <div className="text-center">
            <Button
              onClick={() => router.push(`/stand/${standId}`)}
              variant="outline"
              className="border-gray-500 text-gray-600 hover:bg-gray-50"
            >
              View Normal Stand Page
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              View this stand page without authentication test mode
            </p>
          </div>
        </div>
      </div>

      {/* Full Check-In Modal - Exactly like the real stands page */}
      <Dialog open={showCheckInModal} onOpenChange={setShowCheckInModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[9999]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#2d5d2a]">
              Check In to {stand.stand_name}
            </DialogTitle>
            <DialogDescription className="text-[#5e4b3a]/80">
              Help others by sharing current stand conditions. Your check-in will be visible to the community.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Daily Limit Warning */}
            {user && checkInCount >= 8 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  You have made {checkInCount}/10 check-ins today. 
                  {checkInCount >= 10 ? ' Daily limit reached.' : ` ${10 - checkInCount} remaining.`}
                </p>
              </div>
            )}

            {/* Inventory Level - Required */}
            <div>
              <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                Current Inventory Level *
              </label>
              <div className="space-y-2">
                {['Full', 'Low', 'Empty'].map((level) => (
                  <label key={level} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="inventoryLevel"
                      value={level}
                      checked={checkInData.inventoryLevel === level}
                      onChange={(e) => setCheckInData(prev => ({ ...prev, inventoryLevel: e.target.value }))}
                      className="w-4 h-4 text-[#2d5d2a] border-gray-300 focus:ring-[#2d5d2a]"
                    />
                    <span className="text-sm text-[#5e4b3a]">
                      {level === 'Full' && '🟢 Full - Plenty available'}
                      {level === 'Low' && '🟠 Low - Limited supply'}
                      {level === 'Empty' && '🔴 Empty - No firewood available'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Methods Confirmation */}
            <div>
              <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                Available Payment Methods
              </label>
              <p className="text-xs text-[#5e4b3a]/60 mb-3">
                Update which payment methods are currently working at this stand
              </p>
              <div className="space-y-2">
                {/* All possible payment methods */}
                {['Cash', 'Venmo', 'PayPal', 'Zelle', 'Credit Card', 'Check'].map((method) => {
                  // Check if this method is currently supported (normalize for comparison)
                  const isCurrentlySupported = stand.payment_methods.some(standMethod => 
                    normalizePaymentMethod(standMethod) === method
                  )
                  
                  return (
                    <label key={method} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checkInData.paymentMethods.includes(method)}
                        onChange={() => handlePaymentMethodToggle(method)}
                        className="w-4 h-4 text-[#2d5d2a] border-gray-300 rounded focus:ring-[#2d5d2a]"
                      />
                      <span className="text-sm text-[#5e4b3a] flex items-center">
                        <span className="mr-2">{getPaymentIcon(method)}</span>
                        {method}
                        {isCurrentlySupported && (
                          <span className="ml-2 text-xs text-green-600">(currently listed)</span>
                        )}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                Photos (Optional)
              </label>
              <p className="text-xs text-[#5e4b3a]/60 mb-3">
                Share up to 5 photos. Max 2MB each. Photos will be compressed automatically.
              </p>
              
              {checkInData.photos.length < 5 && (
                <div className="mb-4">
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#2d5d2a] transition-colors">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">Click to upload photos</span>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Photo Preview */}
              {checkInData.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {checkInData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Check-in photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setSuggestedPrimary(photo)}
                        className={`absolute bottom-1 left-1 px-2 py-1 text-xs rounded ${
                          checkInData.suggestedPrimaryPhoto === photo
                            ? 'bg-[#2d5d2a] text-white'
                            : 'bg-white/80 text-gray-700'
                        }`}
                      >
                        {checkInData.suggestedPrimaryPhoto === photo ? '⭐ Primary' : 'Set as Primary'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                Location (Optional)
              </label>
              <div className="flex items-center space-x-3">
                {locationPermission === 'pending' && (
                  <Button
                    type="button"
                    onClick={requestLocation}
                    variant="outline"
                    size="sm"
                    className="border-[#2d5d2a] text-[#2d5d2a]"
                  >
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    Share Location
                  </Button>
                )}
                {locationPermission === 'granted' && checkInData.location && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-600 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      Location: {checkInData.location.latitude.toFixed(6)}, {checkInData.location.longitude.toFixed(6)}
                    </span>
                    <Button
                      type="button"
                      onClick={() => {
                        setLocationPermission('pending')
                        setCheckInData(prev => ({ ...prev, location: null }))
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs px-2 py-1 h-7"
                    >
                      Remove
                    </Button>
                  </div>
                )}
                {locationPermission === 'denied' && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Location not shared</span>
                    <Button
                      type="button"
                      onClick={() => setLocationPermission('pending')}
                      variant="outline"
                      size="sm"
                      className="text-xs px-2 py-1 h-7"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-[#5e4b3a] mb-2">
                Additional Notes (Optional)
              </label>
              <Textarea
                value={checkInData.notes}
                onChange={(e) => setCheckInData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Share any additional details about the stand conditions, access, or recommendations..."
                rows={3}
                className="border-gray-300 focus:border-[#2d5d2a] focus:ring-[#2d5d2a]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCheckInModal(false)}
                className="flex-1 border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={submitCheckIn}
                disabled={submittingCheckIn || !checkInData.inventoryLevel || (user && checkInCount >= 10)}
                className="flex-1 bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white"
              >
                {submittingCheckIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Check-In'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
