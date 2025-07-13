import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para TypeScript
export interface Profile {
  id: string
  email: string
  full_name?: string
  agency_name?: string
  phone?: string
  role?: string
  is_approved?: boolean
  is_rejected?: boolean
  created_at: string
  updated_at: string
}

export interface Quote {
  id: string
  user_id: string
  title: string
  destination?: string
  year?: string
  client_data?: any
  flights_data?: any
  accommodations_data?: any
  transfers_data?: any
  services_data?: any
  summary_data?: any
  template_data?: any
  status?: string
  total_amount?: number
  client_name?: string
  pdf_url?: string
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  user_id: string
  name: string
  template_data: {
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    logo: string | null
    agencyName: string
    agencyAddress: string
    agencyPhone: string
    agencyEmail: string
    validityText: string
  }
  created_at: string
  updated_at: string
}
