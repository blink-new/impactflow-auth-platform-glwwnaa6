import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AuthPage } from '@/components/auth/AuthPage'
import DashboardLayout from '@/components/DashboardLayout'
import Dashboard from '@/components/Dashboard'
import FundBridge from '@/components/FundBridge'
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
    <Router>
      <Routes>
        <Route 
          path="/auth" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <AuthPage onAuthSuccess={handleAuthSuccess} />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            user ? (
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />
        <Route 
          path="/fundbridge" 
          element={
            user ? (
              <DashboardLayout>
                <FundBridge />
              </DashboardLayout>
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/auth"} replace />} 
        />
      </Routes>
    </Router>
  )
}

export default App