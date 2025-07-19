import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Separator } from './ui/separator'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  LayoutDashboard,
  Wand2,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  FileText,
  DollarSign,
  Send,
  Menu,
  X
} from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  organization_name: string
  role: string
}

interface Proposal {
  id: string
  project_name: string
  donor: string
  status: string
  created_at: string
}

interface DashboardStats {
  proposalsSubmitted: number
  grantsFound: number
  donorReportsSent: number
}

interface ChartData {
  date: string
  proposals: number
}

const DashboardLayout: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    proposalsSubmitted: 0,
    grantsFound: 0,
    donorReportsSent: 0
  })
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchUserData()
    fetchDashboardData()
  }, [fetchUserData, fetchDashboardData])

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

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Fetch stats
      const [proposalsRes, grantsRes, reportsRes] = await Promise.all([
        supabase.from('proposals').select('*', { count: 'exact' }).eq('user_id', authUser.id),
        supabase.from('grants').select('*', { count: 'exact' }).eq('user_id', authUser.id),
        supabase.from('donor_reports').select('*', { count: 'exact' }).eq('user_id', authUser.id).eq('status', 'sent')
      ])

      setStats({
        proposalsSubmitted: proposalsRes.count || 0,
        grantsFound: grantsRes.count || 0,
        donorReportsSent: reportsRes.count || 0
      })

      // Fetch latest proposals
      const { data: proposalsData } = await supabase
        .from('proposals')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setProposals(proposalsData || [])

      // Generate chart data (last 7 days)
      const chartDataRes = await supabase
        .from('proposals')
        .select('created_at')
        .eq('user_id', authUser.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      const dailyCounts: { [key: string]: number } = {}
      chartDataRes.data?.forEach(proposal => {
        const date = new Date(proposal.created_at).toLocaleDateString()
        dailyCounts[date] = (dailyCounts[date] || 0) + 1
      })

      const chartDataArray = Object.entries(dailyCounts).map(([date, proposals]) => ({
        date,
        proposals
      }))

      setChartData(chartDataArray)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      draft: 'outline',
      submitted: 'default',
      under_review: 'secondary',
      approved: 'default',
      rejected: 'destructive'
    }
    return <Badge variant={variants[status] || 'outline'}>{status.replace('_', ' ')}</Badge>
  }

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Wand2, label: 'GrantGenie', active: false },
    { icon: Users, label: 'YouthBridge', active: false },
    { icon: TrendingUp, label: 'GiveTrack', active: false },
    { icon: Settings, label: 'Settings', active: false }
  ]

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
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors
                  ${item.active 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
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
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
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

        {/* Dashboard content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Proposals Submitted</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.proposalsSubmitted}</div>
                  <p className="text-xs text-muted-foreground">
                    Total proposals in the system
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Grants Found</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.grantsFound}</div>
                  <p className="text-xs text-muted-foreground">
                    Available funding opportunities
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Donor Reports Sent</CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.donorReportsSent}</div>
                  <p className="text-xs text-muted-foreground">
                    Reports delivered to donors
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Latest proposals table */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Latest Proposals</CardTitle>
                  <CardDescription>
                    Your 5 most recent project proposals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Donor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proposals.map((proposal) => (
                        <TableRow key={proposal.id}>
                          <TableCell className="font-medium">
                            {proposal.project_name}
                          </TableCell>
                          <TableCell>{proposal.donor}</TableCell>
                          <TableCell>
                            {getStatusBadge(proposal.status)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(proposal.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Proposal generation chart */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Proposal Activity</CardTitle>
                  <CardDescription>
                    Proposals created over the last 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="proposals" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={{ fill: '#3B82F6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout