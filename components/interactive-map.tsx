"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, MapPin, Loader2 } from "lucide-react"
import { supabase } from "../lib/supabase"

interface FirewoodStand {
  id: string
  stand_name: string
  address: string
  latitude: number
  longitude: number
  payment_methods: string[]
  is_approved: boolean
  average_rating?: number
  inventory_level?: string | null | undefined
}

const FALLBACK_LOCATION = {
  lat: 42.6369,
  lng: -82.7326,
  address: "36300 Front St, New Baltimore, MI 48047"
}

export default function InteractiveMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markersGroup = useRef<any>(null)

  const [allStands, setAllStands] = useState<FirewoodStand[]>([])
  const [visibleStands, setVisibleStands] = useState<FirewoodStand[]>([])
  const [userLocation, setUserLocation] = useState(FALLBACK_LOCATION)
  const [locationStatus, setLocationStatus] = useState<'fallback' | 'requesting' | 'granted' | 'denied'>('fallback')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Initialize map and fetch data on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Aggressive cleanup and reset - always start fresh
      console.log("Forcing complete map reset...")
      
      // Force cleanup of any existing map instance
      if (map.current) {
        console.log("Removing existing map instance...")
        try {
          map.current.off() // Remove all event listeners
          map.current.remove()
        } catch (error) {
          console.warn("Error cleaning up existing map:", error)
        }
      }
      
      // Always reset everything to null
      map.current = null
      markersGroup.current = null
      setMapReady(false)
      setError(null)
      
      // Wait for DOM to be completely ready and then initialize
      const initializeWhenReady = () => {
        // Double-check that container exists and is valid
        if (mapContainer.current && document.contains(mapContainer.current)) {
          // Ensure we start with a clean slate
          if (!map.current) {
            console.log("Starting fresh map initialization...")
            initializeMap()
          } else {
            console.warn("Map reference still exists, forcing cleanup and retry...")
            map.current = null
            markersGroup.current = null
            setTimeout(initializeWhenReady, 100)
          }
        } else {
          // Container not ready, wait and try again
          setTimeout(initializeWhenReady, 50)
        }
      }

      // Give DOM time to settle after navigation
      setTimeout(initializeWhenReady, 150)
      fetchStands()
      requestUserLocation()
    }

    // Cleanup function to properly destroy map when component unmounts
    return () => {
      console.log("Component unmounting - cleaning up map...")
      if (map.current) {
        try {
          map.current.off() // Remove all event listeners
          map.current.remove()
        } catch (error) {
          console.warn("Error cleaning up map on unmount:", error)
        }
      }
      map.current = null
      markersGroup.current = null
      setMapReady(false)
    }
  }, [])

  // Update visible stands when location or stands change
  useEffect(() => {
    if (allStands.length > 0) {
      // Show all stands, not just those within radius
      setVisibleStands(allStands)
    }
  }, [allStands, userLocation])

  // Update map markers when visible stands change
  useEffect(() => {
    if (mapReady && map.current && visibleStands.length > 0) {
      updateMapMarkers()
    }
  }, [visibleStands, mapReady])

  const initializeMap = async () => {
    try {
      console.log("Starting map initialization...")
      
      // Always ensure we start with a clean slate
      if (map.current) {
        console.log("Found existing map reference, removing it...")
        try {
          map.current.off()
          map.current.remove()
        } catch (error) {
          console.warn("Error removing existing map:", error)
        }
        map.current = null
        markersGroup.current = null
      }

      // Validate DOM element
      if (!mapContainer.current || !document.contains(mapContainer.current)) {
        console.warn("Map container not ready or not attached to DOM")
        setError("Map container not ready")
        return
      }

      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        console.log("Loading Leaflet CSS...")
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      // Load Leaflet JS
      if (!window.L) {
        console.log("Loading Leaflet JS...")
        await new Promise((resolve, reject) => {
          const script = document.createElement("script")
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          script.onload = () => {
            console.log("Leaflet JS loaded successfully")
            resolve(null)
          }
          script.onerror = (err) => {
            console.error("Failed to load Leaflet JS:", err)
            reject(err)
          }
          document.head.appendChild(script)
        })
      }

      // Wait for Leaflet to be ready
      await new Promise(resolve => setTimeout(resolve, 100))

      // Final validation before creating map
      if (!mapContainer.current || !document.contains(mapContainer.current)) {
        console.warn("Map container became invalid during initialization")
        setError("Map container became invalid")
        return
      }

      // Create the map - always create fresh
      console.log("Creating new map instance...")
      console.log("Map container element:", mapContainer.current)

      try {
        // Clear any existing content in the container
        mapContainer.current.innerHTML = ''
        
        map.current = window.L.map(mapContainer.current, {
          center: [userLocation.lat, userLocation.lng],
          zoom: 9,
          zoomControl: true,
          attributionControl: true
        })

        // Add tile layer
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map.current)

        // Initialize markers group
        markersGroup.current = window.L.featureGroup().addTo(map.current)

        console.log("Map initialized successfully")
        setMapReady(true)
        setError(null)

        // Force map to resize to fill container
        setTimeout(() => {
          if (map.current && mapContainer.current && document.contains(mapContainer.current)) {
            map.current.invalidateSize()
          }
        }, 100)
      } catch (mapError) {
        console.error("Error creating Leaflet map instance:", mapError)
        setError("Failed to create map instance: " + mapError.message)
        return
      }
    } catch (error) {
      console.error("Error loading map:", error)
      setError("Failed to load map: " + error.message)
    }
  }

  const fetchStands = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching stands from Supabase...")

      const { data, error: fetchError } = await supabase
        .from("firewood_stands")
        .select("id, stand_name, address, latitude, longitude, payment_methods, is_approved, inventory_level")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .neq("latitude", 0)
        .neq("longitude", 0)

      if (fetchError) {
        console.error("Supabase fetch error:", fetchError)
        throw fetchError
      }

      console.log("Fetched stands:", data?.length || 0, "stands")
      setAllStands(data || [])
    } catch (err: any) {
      console.error("Error fetching stands:", err)
      setError("Failed to load firewood stands: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied')
      return
    }

    setLocationStatus('requesting')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: "Your location"
        }
        setUserLocation(newLocation)
        setLocationStatus('granted')

        // Update map center
        if (map.current) {
          map.current.setView([newLocation.lat, newLocation.lng], 9)
        }
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

  const filterStandsByRadius = (stands: FirewoodStand[], center: typeof userLocation, radiusMiles: number) => {
    return stands.filter(stand => {
      const distance = calculateDistance(center.lat, center.lng, stand.latitude, stand.longitude)
      return distance <= radiusMiles
    })
  }

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

  const updateMapMarkers = () => {
    if (!map.current || !window.L || !markersGroup.current) {
      console.warn("Cannot update markers - map not ready")
      return
    }

    // Verify map container is still valid
    if (!mapContainer.current || !document.contains(mapContainer.current)) {
      console.warn("Cannot update markers - map container invalid")
      return
    }

    try {
      // Clear existing markers
      markersGroup.current.clearLayers()

    // Add user location marker
    const userIcon = window.L.divIcon({
      html: `<div style="
        background-color: #3b82f6;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>`,
      className: "user-location-icon",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    window.L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(markersGroup.current)
      .bindPopup(`<div style="text-align: center; font-weight: 600; color: #3b82f6;">📍 ${locationStatus === 'granted' ? 'Your Location' : 'Default Location'}</div>`)

    // Add stand markers
    visibleStands.forEach((stand) => {
      const distance = calculateDistance(userLocation.lat, userLocation.lng, stand.latitude, stand.longitude)

      // Create custom icon based on approval status
      const iconColor = stand.is_approved ? "#2d5d2a" : "#f59e0b"
      const customIcon = window.L.divIcon({
        html: `
          <div style="
            background-color: ${iconColor};
            width: 20px;
            height: 20px;
            border-radius: 50% 50% 50% 0;
            border: 2px solid white;
            transform: rotate(-45deg);
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            <div style="
              width: 8px;
              height: 8px;
              background-color: white;
              border-radius: 50%;
              position: absolute;
              top: 4px;
              left: 4px;
            "></div>
          </div>
        `,
        className: "custom-div-icon",
        iconSize: [20, 20],
        iconAnchor: [10, 20],
        popupAnchor: [0, -20],
      })

      // Create popup content
      const popupContent = createPopupContent(stand, distance)

      // Create marker
      window.L.marker([stand.latitude, stand.longitude], { icon: customIcon })
        .addTo(markersGroup.current)
        .bindPopup(popupContent, {
          maxWidth: 300,
          className: "custom-popup",
        })
    })

    // Don't auto-fit bounds to preserve the initial zoom level showing ~25 mile radius
    // Users can zoom out to see all stands if needed
    } catch (error) {
      console.error("Error updating map markers:", error)
      // Don't set error state here as this is recoverable
    }
  }

  const getInventoryLevelBadge = (level: string | null | undefined) => {
      if (!level) return ''

      const levelConfig = {
        'High': { color: '#059669', bgColor: '#ecfdf5', icon: '🟢' },
        'Medium': { color: '#d97706', bgColor: '#fef3c7', icon: '🟡' },
        'Low': { color: '#ea580c', bgColor: '#fed7aa', icon: '🟠' },
        'None': { color: '#dc2626', bgColor: '#fee2e2', icon: '🔴' }
      }

      const config = levelConfig[level as keyof typeof levelConfig]
      if (!config) return ''

      const displayLevel = level === 'None' ? 'Empty' : level

      return `<span style="background: ${config.bgColor}; color: ${config.color}; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; margin-top: 4px; display: inline-block;">${config.icon} ${displayLevel} Stock</span>`
    }

  const createPopupContent = (stand: FirewoodStand, distance: number) => {
    const statusBadge = stand.is_approved
      ? `<span style="background: #ecfdf5; color: #059669; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">Active</span>`
      : `<span style="background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">⏰ Pending</span>`

    const getCityState = (address: string) => {
      const parts = address.split(",")
      if (parts.length >= 3) {
        const city = parts[parts.length - 3]?.trim()
        const state = parts[parts.length - 2]?.trim()
        const zip = parts[parts.length - 1]?.trim()
        return `${city}, ${state} ${zip}`
      } else if (parts.length >= 2) {
        const city = parts[parts.length - 2]?.trim() || parts[0]?.trim()
        const state = parts[parts.length - 1]?.trim()
        return `${city}, ${state}`
      }
      return address
    }

    const getDirectionsUrl = (stand: FirewoodStand) => {
      return `https://www.google.com/maps/dir/?api=1&destination=${stand.latitude},${stand.longitude}`
    }

    const getPaymentIcons = (methods: string[]) => {
      const getPaymentIcon = (method: string) => {
        const lowerMethod = method.toLowerCase()
        if (lowerMethod.includes("venmo")) return `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="display: inline-block; vertical-align: middle;">
            <rect width="24" height="24" rx="4" fill="#3D95CE"/>
            <path d="M18.5 4.5c1.2 1.8 1.8 3.9 1.8 6.3 0 4.8-2.4 9.6-6.6 13.2h-4.2L6.6 7.2h3.9l1.8 11.4c2.1-2.1 3.6-5.1 3.6-8.1 0-1.5-.3-2.7-.9-3.9h3.5z" fill="white"/>
          </svg>
        `
        if (lowerMethod.includes("paypal")) return `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="display: inline-block; vertical-align: middle;">
            <rect width="24" height="24" rx="4" fill="#0070BA"/>
            <text x="12" y="17" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="Arial, sans-serif">P</text>
          </svg>
        `
        if (lowerMethod.includes("zelle")) return `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; color: #6b46c1;">
            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
          </svg>
        `
        if (lowerMethod.includes("cash")) return `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; color: #16a34a;">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        `
        return `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; color: #6b7280;">
            <circle cx="12" cy="12" r="10"/>
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
            <path d="M12 18V6"/>
          </svg>
        `
      }

      return methods.map(method => {
        const icon = getPaymentIcon(method)
        const displayMethod = method.replace(/Cash Box/gi, 'Cash')
        return `<span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 4px; display: inline-flex; align-items: center; gap: 2px;">${icon} ${displayMethod}</span>`
      }).join('')
    }

    const distanceDisplay = locationStatus === 'granted' 
      ? `${distance.toFixed(1)} miles away`
      : `<span title="Enable location sharing for accurate distance">${distance.toFixed(1)} miles away*</span>`

      // Conditionally render the inventory level badge
    const inventoryLevelBadge = stand.inventory_level ? getInventoryLevelBadge(stand.inventory_level) : '';

    return `
      <div style="font-family: system-ui, sans-serif; padding: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px;">
          <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #5e4b3a; line-height: 1.2; flex: 1; min-width: 0;">${stand.stand_name}</h3>
          <div style="display: flex; gap: 4px; align-items: center; flex-shrink: 0; white-space: nowrap;">
            ${statusBadge}
            ${inventoryLevelBadge}
          </div>
        </div>

        <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">${getCityState(stand.address)}</p>
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #2d5d2a; font-weight: 600;">${distanceDisplay}</p>

        <div style="margin-bottom: 8px;">
          ${getPaymentIcons(stand.payment_methods)}
        </div>

        <div style="display: flex; gap: 4px; margin-top: 8px;">
          <a href="/stand/${stand.id}" 
             style="
               display: inline-block;
               background: #5e4b3a;
               color: white;
               text-decoration: none;
               padding: 6px 12px;
               border-radius: 6px;
               font-size: 12px;
               font-weight: 500;
               flex: 1;
               text-align: center;
               box-sizing: border-box;
             ">
            View Details
          </a>
          <a href="${getDirectionsUrl(stand)}" target="_blank" rel="noopener noreferrer" 
             style="
               display: inline-block;
               background: #2d5d2a;
               color: white;
               text-decoration: none;
               padding: 6px 12px;
               border-radius: 6px;
               font-size: 12px;
               font-weight: 500;
               flex: 1;
               text-align: center;
               box-sizing: border-box;
             ">
            Directions ↗
          </a>
        </div>
      </div>
    `
  }

  const handleRefresh = () => {
    fetchStands()
    requestUserLocation()
  }

  if (loading && allStands.length === 0) {
    return (
      <div className="w-full h-[400px] md:h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-[#2d5d2a] mx-auto mb-2" />
          <p className="text-[#5e4b3a]">Loading map and firewood stands...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-[400px] md:h-[500px] bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error}</p>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="border-[#2d5d2a] text-[#2d5d2a] hover:bg-[#2d5d2a]/10 bg-transparent"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[#5e4b3a] mb-2">Find Firewood Stands</h2>
        <p className="text-lg text-[#5e4b3a]/80">
          {visibleStands.length} stands nationwide (approved & pending) • Click pins for details and directions
        </p>

        {/* Location Status */}
        <div className="flex items-center justify-center gap-2 mt-2 text-sm">
          <MapPin className="h-4 w-4 text-[#2d5d2a]" />
          {locationStatus === 'requesting' && (
            <span className="text-[#5e4b3a]">
              <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
              Getting your location...
            </span>
          )}
          {locationStatus === 'granted' && (
            <span className="text-[#2d5d2a]">Using your current location</span>
          )}
          {locationStatus === 'denied' && (
            <span className="text-[#5e4b3a]">Using default location (New Baltimore, MI)</span>
          )}
          {locationStatus === 'fallback' && (
            <span className="text-[#5e4b3a]">Loading from New Baltimore, MI</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center">
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="border-[#2d5d2a] text-[#2d5d2a] hover:bg-[#2d5d2a]/10 bg-transparent"
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Map */}
      <div className="w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-lg border border-gray-200">
        {!mapReady && !error && (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="animate-spin h-8 w-8 text-[#2d5d2a] mx-auto mb-2" />
              <p className="text-[#5e4b3a]">Loading map...</p>
            </div>
          </div>
        )}
        <div 
          ref={mapContainer} 
          className="w-full h-full" 
          style={{ 
            display: mapReady ? 'block' : 'none',
            minHeight: '400px'
          }}
        />
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#2d5d2a] rounded-full"></div>
          <span className="text-[#5e4b3a]">Active Stands</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#f59e0b] rounded-full"></div>
          <span className="text-[#5e4b3a]">Pending Approval</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#3b82f6] rounded-full"></div>
          <span className="text-[#5e4b3a]">Your Location</span>
        </div>
      </div>
    </div>
  )
}