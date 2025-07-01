import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for better TypeScript support
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      firewood_stands: {
        Row: {
          id: string
          user_id: string
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
        Insert: {
          id?: string
          user_id: string
          stand_name: string
          address: string
          latitude?: number | null
          longitude?: number | null
          wood_types: string[]
          price_range: string
          payment_methods: string[]
          additional_details?: string | null
          photo_url?: string | null
          onsite_person?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stand_name?: string
          address?: string
          latitude?: number | null
          longitude?: number | null
          wood_types?: string[]
          price_range?: string
          payment_methods?: string[]
          additional_details?: string | null
          photo_url?: string | null
          onsite_person?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
