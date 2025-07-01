"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  TreesIcon as Tree,
  MapPin,
  Filter,
  CheckCircle,
  Clock,
  CreditCard,
  Smartphone,
  DollarSign,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "./lib/supabase"

interface FirewoodStand {
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
  onsite_person: boolean
  is_approved: boolean
  created_at: string
  updated_at: string
}

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
]

const STATE_ABBREVIATIONS: { [key: string]: string } = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
}

function getPaymentIcon(method: string) {
  const lowerMethod = method.toLowerCase()
  if (lowerMethod.includes("venmo")) return <Smartphone className="h-4 w-4 text-blue-600" />
  if (lowerMethod.includes("paypal")) return <CreditCard className="h-4 w-4 text-blue-500" />
  if (lowerMethod.includes("zelle")) return <Zap className="h-4 w-4 text-purple-600" />
  if (lowerMethod.includes("cash")) return <DollarSign className="h-4 w-4 text-green-600" />
  return <CreditCard className="h-4 w-4 text-gray-600" />
}

function StandCard({ stand }: { stand: FirewoodStand }) {
  const getStatusBadge = () => {
    if (stand.is_approved) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
          <CheckCircle className="h-3 w-3" />
          Active
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
          <Clock className="h-3 w-3" />
          Pending
        </div>
      )
    }
  }

  const getCityState = (address: string) => {
    const parts = address.split(",")
    if (parts.length >= 2) {
      const city = parts[parts.length - 3]?.trim() || parts[0]?.trim()
      const stateAbbr = parts[parts.length - 2]?.trim()

      // Convert state abbreviation to full state name
      const fullStateName = Object.keys(STATE_ABBREVIATIONS).find((key) => STATE_ABBREVIATIONS[key] === stateAbbr)

      return `${city}, ${fullStateName || stateAbbr}`
    }
    return address
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-[#5e4b3a] line-clamp-2">{stand.stand_name}</h3>
        {getStatusBadge()}
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 mb-3 text-[#5e4b3a]/80">
        <MapPin className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm">{getCityState(stand.address)}</span>
        <span className="text-xs text-[#5e4b3a]/60 ml-auto">XX mi</span>
      </div>

      {/* Wood Types */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {stand.wood_types.slice(0, 4).map((type, index) => (
            <span
              key={index}
              className="text-xs bg-[#f5f1e8] text-[#5e4b3a] px-2 py-1 rounded-full border border-[#2d5d2a]/20"
            >
              {type}
            </span>
          ))}
          {stand.wood_types.length > 4 && (
            <span className="text-xs text-[#5e4b3a]/60 px-2 py-1">+{stand.wood_types.length - 4} more</span>
          )}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-4">
        <span className="text-sm font-medium text-[#2d5d2a]">{stand.price_range}</span>
      </div>

      {/* Payment Methods */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5e4b3a]/70">Payment:</span>
          <div className="flex gap-1">
            {stand.payment_methods.slice(0, 4).map((method, index) => (
              <div key={index} title={method} className="flex items-center">
                {getPaymentIcon(method)}
              </div>
            ))}
            {stand.payment_methods.length > 4 && (
              <span className="text-xs text-[#5e4b3a]/60">+{stand.payment_methods.length - 4}</span>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      {stand.onsite_person && (
        <div className="mb-4">
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Owner Usually Available</span>
        </div>
      )}

      {/* Action Button */}
      <Button
        className="w-full bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white"
        onClick={() => {
          // Future: Open stand details modal or page
          console.log("View details for:", stand.id)
        }}
      >
        View Details
      </Button>
    </div>
  )
}

export default function DirectoryPage() {
  const [stands, setStands] = useState<FirewoodStand[]>([])
  const [filteredStands, setFilteredStands] = useState<FirewoodStand[]>([])
  const [selectedState, setSelectedState] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stateStandCounts, setStateStandCounts] = useState<{ [key: string]: number }>({})

  // Fetch stands from Supabase
  useEffect(() => {
    fetchStands()
  }, [])

  // Filter stands when state selection changes
  useEffect(() => {
    if (selectedState === "") {
      setFilteredStands(stands)
    } else {
      const stateAbbr = STATE_ABBREVIATIONS[selectedState]
      const filtered = stands.filter(
        (stand) => stand.address.includes(`, ${stateAbbr} `) || stand.address.includes(`, ${stateAbbr},`),
      )
      setFilteredStands(filtered)
    }
  }, [selectedState, stands])

  // Calculate state counts
  useEffect(() => {
    const counts: { [key: string]: number } = {}
    US_STATES.forEach((state) => {
      const stateAbbr = STATE_ABBREVIATIONS[state]
      const count = stands.filter(
        (stand) => stand.address.includes(`, ${stateAbbr} `) || stand.address.includes(`, ${stateAbbr},`),
      ).length
      counts[state] = count
    })
    setStateStandCounts(counts)
  }, [stands])

  const fetchStands = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("firewood_stands")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setStands(data || [])
    } catch (err: any) {
      console.error("Error fetching stands:", err)
      setError(err.message || "Failed to load firewood stands")
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedState("")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f5f1e8] to-white">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Tree className="h-6 w-6 text-[#2d5d2a]" />
              <span className="text-xl font-bold text-[#2d5d2a]">FindLocalFirewood</span>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d5d2a] mx-auto mb-4"></div>
            <p className="text-[#5e4b3a]">Loading firewood stands...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f5f1e8] to-white">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Tree className="h-6 w-6 text-[#2d5d2a]" />
              <span className="text-xl font-bold text-[#2d5d2a]">FindLocalFirewood</span>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchStands} className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white">
              Try Again
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f1e8] to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Tree className="h-6 w-6 text-[#2d5d2a]" />
            <span className="text-xl font-bold text-[#2d5d2a]">FindLocalFirewood</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/directory" className="text-[#2d5d2a] font-medium">
              Directory
            </Link>
            <Link href="/list-your-stand" className="text-[#5e4b3a] hover:text-[#2d5d2a] font-medium transition-colors">
              List Your Stand
            </Link>
            <Link href="#" className="text-[#5e4b3a] hover:text-[#2d5d2a] font-medium transition-colors">
              About
            </Link>
          </nav>
          <div className="hidden md:flex gap-3">
            <Link href="/login">
              <Button
                variant="outline"
                className="border-[#2d5d2a] text-[#2d5d2a] hover:bg-[#2d5d2a]/10 bg-transparent"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white">Sign Up</Button>
            </Link>
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

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#5e4b3a] mb-4">Firewood Stand Directory</h1>
          <p className="text-lg text-[#5e4b3a]/80 max-w-2xl mx-auto">
            Browse and discover local firewood stands in your area. Find quality wood from trusted community suppliers.
          </p>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-[#5e4b3a]" />
              <div className="flex items-center gap-2">
                <label htmlFor="state-filter" className="text-sm font-medium text-[#5e4b3a]">
                  Filter by State:
                </label>
                <select
                  id="state-filter"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5d2a] focus:border-transparent"
                >
                  <option value="">All States</option>
                  {US_STATES.map((state) => (
                    <option
                      key={state}
                      value={state}
                      disabled={stateStandCounts[state] === 0}
                      className={stateStandCounts[state] === 0 ? "text-gray-400" : ""}
                    >
                      {state} {stateStandCounts[state] > 0 ? `(${stateStandCounts[state]})` : "(0)"}
                    </option>
                  ))}
                </select>
              </div>
              {selectedState && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-[#5e4b3a] border-[#5e4b3a] hover:bg-[#5e4b3a]/10 bg-transparent"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="text-sm text-[#5e4b3a]/70">
              Showing {filteredStands.length} of {stands.length} stands
            </div>
          </div>
        </div>

        {/* Payment Methods Legend */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
          <h3 className="text-sm font-medium text-[#5e4b3a] mb-3">Payment Method Icons:</h3>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span>Cash</span>
            </div>
            <div className="flex items-center gap-1">
              <Smartphone className="h-4 w-4 text-blue-600" />
              <span>Venmo</span>
            </div>
            <div className="flex items-center gap-1">
              <CreditCard className="h-4 w-4 text-blue-500" />
              <span>PayPal</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-purple-600" />
              <span>Zelle</span>
            </div>
            <div className="flex items-center gap-1">
              <CreditCard className="h-4 w-4 text-gray-600" />
              <span>Other</span>
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredStands.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-[#f5f1e8] rounded-full flex items-center justify-center mx-auto">
                <Tree className="h-8 w-8 text-[#2d5d2a]" />
              </div>
              <h2 className="text-2xl font-semibold text-[#5e4b3a]">
                {selectedState ? `No stands found in ${selectedState}` : "No stands found"}
              </h2>
              <p className="text-[#5e4b3a]/70">
                {selectedState
                  ? `Try selecting a different state or clearing the filter to see all available stands.`
                  : `Be the first to list a firewood stand in your area!`}
              </p>
              <div className="pt-4">
                {selectedState ? (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="border-[#5e4b3a] text-[#5e4b3a] hover:bg-[#5e4b3a]/10 bg-transparent mr-4"
                  >
                    Clear Filter
                  </Button>
                ) : null}
                <Link href="/list-your-stand">
                  <Button className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white">List Your Stand</Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStands.map((stand) => (
              <StandCard key={stand.id} stand={stand} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
