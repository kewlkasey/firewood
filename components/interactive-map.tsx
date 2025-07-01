"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "../lib/supabase"

interface FirewoodStand {
  id: string
  stand_name: string
  address: string
  latitude: number
  longitude: number
  wood_types: string[]
  price_range: string
  payment_methods: string[]
  additional_details: string | null
  onsite_person: boolean
  is_approved: boolean
}

export default function InteractiveMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [stands, setStands] = useState<FirewoodStand[]>([])
  const [selectedStand, setSelectedStand] = useState<FirewoodStand | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Fetch stands data
  useEffect(() => {
    fetchStands()
  }, [])

  // Initialize map when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      loadLeafletAndInitMap()
    }
  }, [])

  // Add markers when stands are loaded and map is ready
  useEffect(() => {
    if (mapReady && stands.length > 0) {
      addMarkersToMap()
    }
  }, [stands, mapReady])

  const fetchStands = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("firewood_stands")
        .select("*")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .neq("latitude", 0)
        .neq("longitude", 0)

      if (fetchError) {
        throw fetchError
      }

      setStands(data || [])
    } catch (err: any) {
      console.error("Error fetching stands for map:", err)
      setError("Failed to load firewood stand locations")
    } finally {
      setLoading(false)
    }
  }

  const loadLeafletAndInitMap = async () => {
    try {
      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      // Load Leaflet JS
      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script")
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      // Initialize map
      if (mapContainer.current && !map.current) {
        map.current = window.L.map(mapContainer.current).setView([42.0, -89.0], 6)

        // Add tile layer
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map.current)

        setMapReady(true)
      }
    } catch (error) {
      console.error("Error loading map:", error)
      setError("Failed to load map")
    }
  }

  const addMarkersToMap = () => {
    if (!map.current || !window.L) return

    // Calculate bounds to fit all markers
    const group = new window.L.featureGroup()

    stands.forEach((stand) => {
      // Create custom icon based on status
      const iconColor = stand.is_approved ? "#2d5d2a" : "#5e4b3a"
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
      const popupContent = createPopupContent(stand)

      // Create marker
      const marker = window.L.marker([stand.latitude, stand.longitude], {
        icon: customIcon,
      })
        .addTo(map.current)
        .bindPopup(popupContent, {
          maxWidth: 300,
          className: "custom-popup",
        })

      // Add to group for bounds calculation
      group.addLayer(marker)
    })

    // Fit map to show all markers
    if (stands.length > 0) {
      map.current.fitBounds(group.getBounds(), { padding: [20, 20] })
    }
  }

  const createPopupContent = (stand: FirewoodStand) => {
    const getCityState = (address: string) => {
      const parts = address.split(",")
      if (parts.length >= 2) {
        const city = parts[parts.length - 3]?.trim() || parts[0]?.trim()
        const state = parts[parts.length - 2]?.trim()
        return `${city}, ${state}`
      }
      return address
    }

    const getDirectionsUrl = (stand: FirewoodStand) => {
      return `https://www.google.com/maps/dir/?api=1&destination=${stand.latitude},${stand.longitude}`
    }

    const statusBadge = stand.is_approved
      ? `<span style="background: #ecfdf5; color: #059669; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">✓ Active</span>`
      : `<span style="background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">⏰ Pending</span>`

    const woodTypes = stand.wood_types
      .slice(0, 3)
      .map(
        (type) =>
          `<span style="background: #f5f1e8; color: #5e4b3a; padding: 2px 6px; border-radius: 8px; font-size: 11px; margin-right: 4px;">${type}</span>`,
      )
      .join("")

    const moreTypes =
      stand.wood_types.length > 3
        ? `<span style="color: #6b7280; font-size: 11px;">+${stand.wood_types.length - 3} more</span>`
        : ""

    const ownerAvailable = stand.onsite_person
      ? `<div style="background: #dbeafe; color: #2563eb; padding: 4px 8px; border-radius: 8px; font-size: 11px; margin: 8px 0; display: inline-block;">Owner Usually Available</div>`
      : ""

    return `
      <div style="font-family: system-ui, sans-serif; padding: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #5e4b3a; line-height: 1.2; max-width: 180px;">${stand.stand_name}</h3>
          ${statusBadge}
        </div>
        
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">${getCityState(stand.address)}</p>
        
        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #2d5d2a;">${stand.price_range}</p>
        
        <div style="margin-bottom: 8px;">
          ${woodTypes}
          ${moreTypes}
        </div>
        
        ${ownerAvailable}
        
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
             margin-top: 8px;
             width: 100%;
             text-align: center;
             box-sizing: border-box;
           ">
          Get Directions ↗
        </a>
      </div>
    `
  }

  if (loading) {
    return (
      <div className="w-full h-[400px] md:h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2d5d2a] mx-auto mb-2"></div>
          <p className="text-[#5e4b3a]">Loading map...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-[400px] md:h-[500px] bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error}</p>
        <Button
          onClick={() => {
            setError(null)
            fetchStands()
            loadLeafletAndInitMap()
          }}
          variant="outline"
          className="border-[#2d5d2a] text-[#2d5d2a] hover:bg-[#2d5d2a]/10 bg-transparent"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[#5e4b3a] mb-2">Find Firewood Stands</h2>
        <p className="text-lg text-[#5e4b3a]/80">
          {stands.length} stands available • Click pins for details and directions
        </p>
      </div>

      <div className="w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-lg border border-gray-200">
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      <div className="flex justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#2d5d2a] rounded-full"></div>
          <span className="text-[#5e4b3a]">Active Stands</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#5e4b3a] rounded-full"></div>
          <span className="text-[#5e4b3a]">Pending Approval</span>
        </div>
      </div>
    </div>
  )
}
