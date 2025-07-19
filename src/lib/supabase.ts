import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fedgafgpqmewssmiirwh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZGdhZmdwcW1ld3NzbWlpcndoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTgwOTEsImV4cCI6MjA2ODUzNDA5MX0.KMNU5L9NDI-pevGN0Due1pfvfA1NC7vMQ-MxHjmVox8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'admin' | 'staff' | 'donor'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  organization_name: string
  role: UserRole
  created_at: string
  updated_at: string
}