'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ROIBadge } from '@/components/ui/roi-badge'
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react'

interface AnalyticsData {
  overall: {
    totalRevenue: number
    totalCost: number
    netProfit: number
    roi: number
    totalRecords: number
  }
  departmentSummary: Record<string, {
    totalRevenue: number
    totalCost: number
    netProfit: number
    roi: number
    employeeCount: number
  }>
  topPerformers: Array<{
    employee: {
      id: string
      name: string
      title: string
      department: string
    }
    totalRevenue: number
    totalCost: number
    netProfit: number
    roi: number
    yearsCount: number
  }>
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (departmentFilter !== 'all') params.append('department', departmentFilter)
      if (yearFrom) params.append('yearFrom', yearFrom)
      if (yearTo) params.append('yearTo', yearTo)

      const response = await fetch(`/api/analytics/pnl?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [departmentFilter, yearFrom, yearTo])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return <div className="p-6">Loading analytics...</div>
  }

  if (!analyticsData) {
    return <div className="p-6">No analytics data available</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">P&L Analytics Dashboard</h1>
        <div className="flex gap-4">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Executive">Executive</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Human Resources">Human Resources</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(analyticsData.overall.totalRevenue)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 p-6 rounded-lg">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Total Cost</p>
              <p className="text-2xl font-bold text-red-800">
                {formatCurrency(analyticsData.overall.totalCost)}
              </p>
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-lg ${
          analyticsData.overall.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <div className="flex items-center">
            <TrendingUp className={`h-8 w-8 ${
              analyticsData.overall.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`} />
            <div className="ml-4">
              <p className={`text-sm font-medium ${
                analyticsData.overall.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                Net Profit
              </p>
              <p className={`text-2xl font-bold ${
                analyticsData.overall.netProfit >= 0 ? 'text-green-800' : 'text-red-800'
              }`}>
                {formatCurrency(analyticsData.overall.netProfit)}
              </p>
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-lg ${
          analyticsData.overall.roi >= 0 ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <div className="flex items-center">
            <Target className={`h-8 w-8 ${
              analyticsData.overall.roi >= 0 ? 'text-green-600' : 'text-red-600'
            }`} />
            <div className="ml-4">
              <p className={`text-sm font-medium ${
                analyticsData.overall.roi >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                Overall ROI
              </p>
              <p className={`text-2xl font-bold ${
                analyticsData.overall.roi >= 0 ? 'text-green-800' : 'text-red-800'
              }`}>
                {analyticsData.overall.roi.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Performance */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Department Performance</h2>
          <div className="space-y-4">
            {Object.entries(analyticsData.departmentSummary).map(([dept, data]) => (
              <div key={dept} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{dept}</h3>
                  <ROIBadge roi={data.roi} size="sm" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Revenue:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {formatCurrency(data.totalRevenue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cost:</span>
                    <span className="ml-2 font-medium text-red-600">
                      {formatCurrency(data.totalCost)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Profit:</span>
                    <span className={`ml-2 font-medium ${
                      data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(data.netProfit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Employees:</span>
                    <span className="ml-2 font-medium">{data.employeeCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Top Performers by ROI</h2>
          <div className="space-y-4">
            {analyticsData.topPerformers.slice(0, 10).map((performer, index) => (
              <div key={performer.employee.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{performer.employee.name}</h3>
                    <p className="text-sm text-gray-600">{performer.employee.title}</p>
                    <p className="text-xs text-gray-500">{performer.employee.department}</p>
                  </div>
                  <div className="text-right">
                    <ROIBadge roi={performer.roi} size="sm" />
                    <p className="text-xs text-gray-500 mt-1">#{index + 1}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Revenue:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {formatCurrency(performer.totalRevenue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cost:</span>
                    <span className="ml-2 font-medium text-red-600">
                      {formatCurrency(performer.totalCost)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Profit:</span>
                    <span className={`ml-2 font-medium ${
                      performer.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(performer.netProfit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Years:</span>
                    <span className="ml-2 font-medium">{performer.yearsCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
