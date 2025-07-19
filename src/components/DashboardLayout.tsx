import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback } from './ui/avatar'
import {
  LayoutDashboard,
  Wand2,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Search
} from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  organization_name: string
  role: string
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const fetchUserData = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        navigate('/auth')
        return
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) throw error
      setUser(userData)
    } catch (error) {
      console.error('Error fetching user:', error)
      navigate('/auth')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Wand2, label: 'GrantGenie', path: '/grantgenie' },
    { icon: Users, label: 'YouthBridge', path: '/youthbridge' },
    { icon: Search, label: 'FundBridge', path: '/fundbridge' },
    { icon: TrendingUp, label: 'GiveTrack', path: '/givetrack' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ]

  const getPageTitle = () => {
    const currentItem = sidebarItems.find(item => item.path === location.pathname)
    return currentItem?.label || 'Dashboard'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IF</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">ImpactFlow</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.path)
                    setSidebarOpen(false)
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.organization_name}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.full_name} • {user?.organization_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="capitalize">
                {user?.role}
              </Badge>
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout