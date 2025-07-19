'use client'

import { useState, useEffect } from 'react'
import { User, LogOut, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getCurrentUser, logoutUser, getUserProfile } from '@/lib/auth'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
}

export function UserNavigation() {
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
      if (currentUser) {
        setUser(currentUser)
        // Get user profile
        const userProfile = await getUserProfile(currentUser.id)
        setProfile(userProfile)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await logoutUser()
      setUser(null)
      setProfile(null)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
      </div>
    )
  }

  if (!user) {
    // User is not logged in
    return (
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/login')}
          className="text-[#2d5d2a] hover:text-[#1e3d1c]"
        >
          Login
        </Button>
        <Button 
          onClick={() => router.push('/register')}
          className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white"
        >
          Sign Up
        </Button>
      </div>
    )
  }

  // User is logged in
  const initials = profile?.first_name && profile?.last_name 
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : profile?.email?.[0]?.toUpperCase() || 'U'

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-[#2d5d2a] text-white text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-[#2d5d2a] font-medium">
              {profile?.first_name || 'Account'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            onClick={() => router.push('/account')}
            className="flex items-center gap-2"
          >
            <UserCircle className="w-4 h-4" />
            My Account
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Default export for main import
export default UserNavigation

// Export alias for backward compatibility
export { UserNavigation as UserNav }