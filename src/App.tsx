import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthPage } from '@/components/auth/AuthPage'
import DashboardLayout from '@/components/DashboardLayout'
import type { User } from '@supabase/supabase-js'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuthSuccess = () => {
    // User state will be updated by the auth state change listener
  }

  const handleLogout = () => {
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ImpactFlow...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {user ? (
        <DashboardLayout />
      ) : (
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      )}
    </>
  )
}

export default App