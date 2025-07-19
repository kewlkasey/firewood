import { supabase } from "./supabase"
import type { User } from "@supabase/supabase-js"

export interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface LoginData {
  email: string
  password: string
}

// Register a new user
export async function registerUser(data: RegisterData) {
  try {
    console.log("Starting registration process...", { email: data.email })

    // 1. Create auth user with metadata and redirect URL
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
        },
        emailRedirectTo: `${process.env.NODE_ENV === 'production' ? 'https://findlocalfirewood.com' : 'https://' + process.env.REPL_SLUG + '--' + process.env.REPL_OWNER + '.replit.app'}/auth/confirm`,
      },
    })

    if (authError) {
      console.error("Auth signup error:", authError)
      throw authError
    }

    if (!authData.user) {
      throw new Error("Failed to create user")
    }

    console.log("Auth user created successfully:", authData.user.id)

    // 2. Wait a moment for the trigger to work
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 3. Check if profile was created automatically
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Profile check error:", checkError)
    }

    if (!existingProfile) {
      console.log("No automatic profile created, using manual function...")

      // 4. Use the database function to create profile
      const { data: profileData, error: profileError } = await supabase.rpc("create_profile_for_user", {
        user_id: authData.user.id,
        user_email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
      })

      if (profileError) {
        console.error("Profile creation via function failed:", profileError)
        // Don't throw here - user is still created
      } else {
        console.log("Profile created successfully via function:", profileData)
      }
    } else {
      console.log("Profile created automatically:", existingProfile)
    }

    return {
      user: authData.user,
      session: authData.session,
    }
  } catch (error) {
    console.error("Registration error:", error)
    throw error
  }
}

// Login user
export async function loginUser(data: LoginData) {
  try {
    console.log("Starting login process...", { email: data.email })

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      console.error("Login error:", error)
      throw error
    }

    console.log("Login successful:", authData.user?.id)

    return {
      user: authData.user,
      session: authData.session,
    }
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

// Logout user
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Logout error:", error)
    throw error
  }
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

// Get user profile
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Get user profile error:", error)
    throw error
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: {
    first_name?: string
    last_name?: string
    email?: string
  },
) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Update user profile error:", error)
    throw error
  }
}
