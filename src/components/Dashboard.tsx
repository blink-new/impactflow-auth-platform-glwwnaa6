import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  FileText,
  DollarSign,
  Send
} from 'lucide-react'

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

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    proposalsSubmitted: 0,
    grantsFound: 0,
    donorReportsSent: 0
  })
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])

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

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

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

  return (
    <div className="p-6">
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
    </div>
  )
}

export default Dashboard