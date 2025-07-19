import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { useToast } from '../hooks/use-toast'
import { Search, Filter, Heart, ExternalLink, Calendar, Users, MapPin, Building } from 'lucide-react'

interface Grant {
  id: string
  grant_name: string
  deadline: string
  eligibility: string
  sector: string
  region: string
  org_size: string
  youth_led: boolean
  amount: number
  description: string
  status: string
  is_saved?: boolean
}

interface Filters {
  sector: string
  region: string
  org_size: string
  youth_led: boolean | null
  search: string
}

export default function FundBridge() {
  const [grants, setGrants] = useState<Grant[]>([])
  const [filteredGrants, setFilteredGrants] = useState<Grant[]>([])
  const [savedGrantIds, setSavedGrantIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  const [filters, setFilters] = useState<Filters>({
    sector: '',
    region: '',
    org_size: '',
    youth_led: null,
    search: ''
  })

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  // Fetch grants and saved grants
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch all grants
      const { data: grantsData, error: grantsError } = await supabase
        .from('grants')
        .select('*')
        .order('deadline', { ascending: true })

      if (grantsError) throw grantsError

      // Fetch user's saved grants if logged in
      let savedGrants: string[] = []
      if (user) {
        const { data: savedData, error: savedError } = await supabase
          .from('saved_grants')
          .select('grant_id')
          .eq('user_id', user.id)

        if (savedError) throw savedError
        savedGrants = savedData.map(item => item.grant_id)
      }

      setSavedGrantIds(new Set(savedGrants))
      setGrants(grantsData || [])
      setFilteredGrants(grantsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load funding opportunities",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [user, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Apply filters
  useEffect(() => {
    const filtered = grants.filter(grant => {
      const matchesSector = !filters.sector || grant.sector === filters.sector
      const matchesRegion = !filters.region || grant.region === filters.region
      const matchesOrgSize = !filters.org_size || grant.org_size === filters.org_size
      const matchesYouthLed = filters.youth_led === null || grant.youth_led === filters.youth_led
      const matchesSearch = !filters.search || 
        grant.grant_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        grant.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        grant.eligibility.toLowerCase().includes(filters.search.toLowerCase())

      return matchesSector && matchesRegion && matchesOrgSize && matchesYouthLed && matchesSearch
    })

    setFilteredGrants(filtered)
  }, [grants, filters])

  const handleSaveGrant = async (grantId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save grants",
        variant: "destructive"
      })
      return
    }

    try {
      const isSaved = savedGrantIds.has(grantId)
      
      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_grants')
          .delete()
          .eq('user_id', user.id)
          .eq('grant_id', grantId)

        if (error) throw error

        setSavedGrantIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(grantId)
          return newSet
        })

        toast({
          title: "Grant Removed",
          description: "Grant removed from your saved list"
        })
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_grants')
          .insert({
            user_id: user.id,
            grant_id: grantId
          })

        if (error) throw error

        setSavedGrantIds(prev => new Set([...prev, grantId]))

        toast({
          title: "Grant Saved",
          description: "Grant added to your saved list"
        })
      }
    } catch (error) {
      console.error('Error saving grant:', error)
      toast({
        title: "Error",
        description: "Failed to save grant",
        variant: "destructive"
      })
    }
  }

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Expired'
    if (diffDays === 0) return 'Due Today'
    if (diffDays === 1) return 'Due Tomorrow'
    if (diffDays <= 7) return `${diffDays} days left`
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks left`
    return date.toLocaleDateString()
  }

  const getDeadlineColor = (deadline: string) => {
    const date = new Date(deadline)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'bg-gray-100 text-gray-600'
    if (diffDays <= 7) return 'bg-red-100 text-red-700'
    if (diffDays <= 30) return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }

  const clearFilters = () => {
    setFilters({
      sector: '',
      region: '',
      org_size: '',
      youth_led: null,
      search: ''
    })
  }

  const sectors = ['Environment', 'Education', 'Health', 'Gender Equality', 'Leadership', 'Technology', 'Agriculture', 'Arts & Culture']
  const regions = ['Global', 'North America', 'Europe', 'Asia', 'Africa', 'Latin America', 'Oceania']
  const orgSizes = ['Small', 'Medium', 'Large']

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FundBridge</h1>
          <p className="text-gray-600 mt-1">Discover funding opportunities for your organization</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Building className="h-4 w-4" />
          {filteredGrants.length} opportunities found
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search grants by name, description, or eligibility..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Sector</Label>
              <Select value={filters.sector} onValueChange={(value) => setFilters(prev => ({ ...prev, sector: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All sectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sectors</SelectItem>
                  {sectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={filters.region} onValueChange={(value) => setFilters(prev => ({ ...prev, region: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All regions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Organization Size</Label>
              <Select value={filters.org_size} onValueChange={(value) => setFilters(prev => ({ ...prev, org_size: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sizes</SelectItem>
                  {orgSizes.map(size => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Youth-led</Label>
              <div className="flex items-center space-x-2 h-10">
                <Switch
                  checked={filters.youth_led === true}
                  onCheckedChange={(checked) => setFilters(prev => ({ 
                    ...prev, 
                    youth_led: checked ? true : null 
                  }))}
                />
                <span className="text-sm">Youth-led only</span>
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={clearFilters} size="sm">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {filteredGrants.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No grants found</h3>
              <p className="text-gray-600">Try adjusting your filters to see more opportunities</p>
            </CardContent>
          </Card>
        ) : (
          filteredGrants.map((grant) => (
            <Card key={grant.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{grant.grant_name}</h3>
                      {grant.youth_led && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          Youth-led
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{grant.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDeadlineColor(grant.deadline)}`}>
                          {formatDeadline(grant.deadline)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{grant.region}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{grant.org_size} orgs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span>{grant.sector}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-6">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      ${grant.amount?.toLocaleString()}
                    </div>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSaveGrant(grant.id)}
                        className={savedGrantIds.has(grant.id) ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' : ''}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${savedGrantIds.has(grant.id) ? 'fill-current' : ''}`} />
                        {savedGrantIds.has(grant.id) ? 'Saved' : 'Save'}
                      </Button>
                      <Button size="sm" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">Eligibility: </span>
                    <span className="text-gray-600">{grant.eligibility}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}