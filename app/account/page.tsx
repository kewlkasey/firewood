
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Tree, User, Mail, Calendar, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getCurrentUser, getUserProfile } from '@/lib/auth'

interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  created_at?: string
}

export default function AccountPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      
      setUser(currentUser)
      const userProfile = await getUserProfile(currentUser.id)
      setProfile(userProfile)
    } catch (error) {
      console.error('Error loading user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d5d2a]"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#5e4b3a] mb-4">Unable to load account information.</p>
          <Link href="/" className="text-[#2d5d2a] hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  const initials = profile.first_name && profile.last_name 
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : profile.email?.[0]?.toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Tree className="h-6 w-6 text-[#2d5d2a]" />
              <span className="text-xl font-bold text-[#2d5d2a]">FindLocalFirewood</span>
            </Link>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/directory" className="text-[#2d5d2a] hover:underline font-medium">
              Directory
            </Link>
          </nav>
        </div>
      </header>

      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 text-[#2d5d2a] hover:text-[#1e3d1c]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Account Card */}
          <Card>
            <CardHeader className="text-center">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="bg-[#2d5d2a] text-white text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl text-[#2d5d2a]">
                    {profile.first_name && profile.last_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : 'Your Account'
                    }
                  </CardTitle>
                  <p className="text-[#5e4b3a] mt-2">Manage your FindLocalFirewood account</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#2d5d2a] border-b border-gray-200 pb-2">
                  Account Information
                </h3>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-[#2d5d2a]" />
                  <div>
                    <p className="font-medium text-[#5e4b3a]">Email Address</p>
                    <p className="text-sm text-[#5e4b3a]/80">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-[#2d5d2a]" />
                  <div>
                    <p className="font-medium text-[#5e4b3a]">Name</p>
                    <p className="text-sm text-[#5e4b3a]/80">
                      {profile.first_name && profile.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : 'Not set'
                      }
                    </p>
                  </div>
                </div>

                {profile.created_at && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-[#2d5d2a]" />
                    <div>
                      <p className="font-medium text-[#5e4b3a]">Member Since</p>
                      <p className="text-sm text-[#5e4b3a]/80">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Coming Soon Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#2d5d2a] border-b border-gray-200 pb-2">
                  Coming Soon
                </h3>
                <div className="grid gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg opacity-60">
                    <p className="font-medium text-[#5e4b3a]">Profile Picture</p>
                    <p className="text-sm text-[#5e4b3a]/80">Upload and manage your profile photo</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg opacity-60">
                    <p className="font-medium text-[#5e4b3a]">Account Settings</p>
                    <p className="text-sm text-[#5e4b3a]/80">Update your personal information and preferences</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg opacity-60">
                    <p className="font-medium text-[#5e4b3a]">Saved Stands</p>
                    <p className="text-sm text-[#5e4b3a]/80">View and manage your favorite firewood stands</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
