'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Plus, Search, Download, Edit, Trash2, X, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { searchEmployees } from '@/lib/searchUtils'
import { ROIBadge } from '@/components/ui/roi-badge'
import { PnLDetailsDialog } from '@/components/ui/pnl-details-dialog'

interface Employee {
  id: string
  name: string
  title: string
  department: string
  email: string
  phone?: string
  hireDate: string
  salary: number
  status: string
  manager?: {
    id: string
    name: string
    title: string
  }
  pnlSummary?: {
    totalRevenue: number
    totalCost: number
    netProfit: number
    roi: number
    yearsCount: number
  }
}

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [exactMatchMode, setExactMatchMode] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [managerSearchTerm, setManagerSearchTerm] = useState('')
  const [filteredManagers, setFilteredManagers] = useState<Employee[]>([])
  const [selectedEmployeePnL, setSelectedEmployeePnL] = useState<Employee | null>(null)
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<Employee | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    department: '',
    email: '',
    phone: '',
    hireDate: '',
    salary: '',
    status: 'active',
    managerId: '',
  })

  const departments = ['Executive', 'Engineering', 'Finance', 'Human Resources']

  // Filter managers based on search term
  useEffect(() => {
    if (!allEmployees.length) {
      setFilteredManagers([])
      return
    }

    const availableManagers = allEmployees.filter(emp => emp.id !== editingEmployee?.id)
    const searchResults = searchEmployees(availableManagers, managerSearchTerm)
    setFilteredManagers(searchResults)
  }, [allEmployees, editingEmployee, managerSearchTerm])

  const fetchAllEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employees/pnl-summary')
      const data = await response.json()
      
      if (response.ok && Array.isArray(data)) {
        setAllEmployees(data)
        setEmployees(data) // Show all employees initially
      } else {
        console.error('Error fetching employees:', data.error || 'Unknown error')
        setEmployees([])
        setAllEmployees([])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      setEmployees([])
      setAllEmployees([])
    } finally {
      setLoading(false)
    }
  }, [])

  const searchAndFilterEmployees = useCallback((currentSearchTerm: string, currentDepartmentFilter: string, isExactMatch: boolean) => {
    if (!allEmployees.length) return

    let filteredData = allEmployees

    // Apply search if there's a search term
    if (currentSearchTerm.trim()) {
      filteredData = searchEmployees(allEmployees, currentSearchTerm, isExactMatch)
    }

    // Apply department filter
    if (currentDepartmentFilter && currentDepartmentFilter !== 'all') {
      filteredData = filteredData.filter(emp => emp.department === currentDepartmentFilter)
    }

    setEmployees(filteredData)
  }, [allEmployees])

  // Fetch all employees once on mount
  useEffect(() => {
    fetchAllEmployees()
  }, [fetchAllEmployees])

  // Debounced search and filter
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAndFilterEmployees(searchTerm, departmentFilter, exactMatchMode)
    }, 170)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, departmentFilter, exactMatchMode, searchAndFilterEmployees])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees'
      const method = editingEmployee ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setEditingEmployee(null)
        resetForm()
        fetchAllEmployees()
      }
    } catch (error) {
      console.error('Error saving employee:', error)
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      title: employee.title,
      department: employee.department,
      email: employee.email,
      phone: employee.phone || '',
      hireDate: employee.hireDate.split('T')[0],
      salary: employee.salary.toString(),
      status: employee.status,
      managerId: employee.manager?.id || '',
    })
    setManagerSearchTerm('') // Reset search term
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        await fetch(`/api/employees/${id}`, { method: 'DELETE' })
        fetchAllEmployees()
      } catch (error) {
        console.error('Error deleting employee:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      department: '',
      email: '',
      phone: '',
      hireDate: '',
      salary: '',
      status: 'active',
      managerId: '',
    })
    setManagerSearchTerm('') // Reset search term
  }

  const handleAddNew = () => {
    setEditingEmployee(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const handleExport = () => {
    window.open('/api/employees/export', '_blank')
  }

  const handleViewPnL = (employee: Employee) => {
    setSelectedEmployeePnL(employee)
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employee Directory</h1>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="exact-match" className="text-sm font-medium whitespace-nowrap">
            Exact Match
          </Label>
          <input
            id="exact-match"
            type="checkbox"
            checked={exactMatchMode}
            onChange={(e) => setExactMatchMode(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg border relative">
        {/* Scroll indicators */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-white z-20">Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ROI</TableHead>
                <TableHead className="sticky right-0 bg-white z-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(employees) && employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium sticky left-0 bg-white z-20">
                    <button
                      onClick={() => {
                        setSelectedEmployeeDetails(employee)
                        setIsDetailsDialogOpen(true)
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                    >
                      {employee.name}
                    </button>
                  </TableCell>
                  <TableCell>{employee.title}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{new Date(employee.hireDate).toLocaleDateString()}</TableCell>
                  <TableCell>${employee.salary.toLocaleString()}</TableCell>
                  <TableCell>{employee.manager?.name || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      employee.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {employee.pnlSummary ? (
                      <ROIBadge roi={employee.pnlSummary.roi} size="sm" />
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="sticky right-0 bg-white z-20">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewPnL(employee)}
                        title="View P&L Details"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(employee)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(employee.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>


      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="mb-2">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="title" className="mb-2">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="department" className="mb-2">Department</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="email" className="mb-2">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone" className="mb-2">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="hireDate" className="mb-2">Hire Date</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="salary" className="mb-2">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status" className="mb-2">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Manager Selection */}
            <div>
              <Label htmlFor="manager" className="mb-2">Manager</Label>
              
              {/* Search input */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search managers..."
                  value={managerSearchTerm}
                  onChange={(e) => setManagerSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {managerSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setManagerSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Manager selection */}
              <div className="border rounded-md max-h-60 overflow-y-auto">
                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, managerId: '' })}
                    className={`w-full text-left p-2 rounded hover:bg-gray-100 ${
                      formData.managerId === '' ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    <div className="font-medium">No manager (Top level)</div>
                  </button>
                </div>
                
                {filteredManagers.map((emp) => (
                  <div key={emp.id} className="p-2 border-t">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, managerId: emp.id })}
                      className={`w-full text-left p-2 rounded hover:bg-gray-100 ${
                        formData.managerId === emp.id ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-sm text-gray-600">{emp.title}</div>
                      <div className="text-xs text-gray-500">{emp.department}</div>
                    </button>
                  </div>
                ))}
                
                {filteredManagers.length === 0 && managerSearchTerm && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No managers found matching "{managerSearchTerm}"
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingEmployee ? 'Update' : 'Create'} Employee
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* P&L Detail Dialog */}
      <PnLDetailsDialog
        isOpen={!!selectedEmployeePnL}
        onClose={() => setSelectedEmployeePnL(null)}
        employeeId={selectedEmployeePnL?.id || null}
        employeeName={selectedEmployeePnL?.name || null}
      />

      {/* Employee Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={(open) => {
        setIsDetailsDialogOpen(open)
        if (!open) {
          // Small delay to prevent flash
          setTimeout(() => setSelectedEmployeeDetails(null), 150)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEmployeeDetails ? `Employee Details - ${selectedEmployeeDetails.name}` : 'Employee Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedEmployeeDetails && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500">Name</Label>
                  <div className="text-sm font-semibold">{selectedEmployeeDetails.name}</div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">Title</Label>
                  <div className="text-sm">{selectedEmployeeDetails.title}</div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">Department</Label>
                  <div className="text-sm">{selectedEmployeeDetails.department}</div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">Status</Label>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedEmployeeDetails.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedEmployeeDetails.status}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Email</Label>
                    <div className="text-sm">{selectedEmployeeDetails.email}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Phone</Label>
                    <div className="text-sm">{selectedEmployeeDetails.phone || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Employment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Hire Date</Label>
                    <div className="text-sm">{new Date(selectedEmployeeDetails.hireDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Salary</Label>
                    <div className="text-sm font-semibold">${selectedEmployeeDetails.salary.toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Manager</Label>
                    <div className="text-sm">{selectedEmployeeDetails.manager?.name || 'No manager (Top level)'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Manager Title</Label>
                    <div className="text-sm">{selectedEmployeeDetails.manager?.title || '-'}</div>
                  </div>
                </div>
              </div>

              {/* P&L Summary */}
              {selectedEmployeeDetails.pnlSummary && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Financial Performance</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-green-600 font-medium whitespace-nowrap">Total Revenue</div>
                      <div className="text-sm font-semibold text-green-800">
                        ${selectedEmployeeDetails.pnlSummary.totalRevenue.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-xs text-red-600 font-medium whitespace-nowrap">Total Cost</div>
                      <div className="text-sm font-semibold text-red-800">
                        ${selectedEmployeeDetails.pnlSummary.totalCost.toLocaleString()}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      selectedEmployeeDetails.pnlSummary.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className={`text-xs font-medium whitespace-nowrap ${
                        selectedEmployeeDetails.pnlSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Net Profit
                      </div>
                      <div className={`text-sm font-semibold ${
                        selectedEmployeeDetails.pnlSummary.netProfit >= 0 ? 'text-green-800' : 'text-red-800'
                      }`}>
                        ${selectedEmployeeDetails.pnlSummary.netProfit.toLocaleString()}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      selectedEmployeeDetails.pnlSummary.roi >= 0 ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className={`text-xs font-medium whitespace-nowrap ${
                        selectedEmployeeDetails.pnlSummary.roi >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ROI
                      </div>
                      <div className={`text-sm font-semibold ${
                        selectedEmployeeDetails.pnlSummary.roi >= 0 ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {selectedEmployeeDetails.pnlSummary.roi.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleViewPnL(selectedEmployeeDetails)}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View P&L Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleEdit(selectedEmployeeDetails)
                    setIsDetailsDialogOpen(false)
                    setTimeout(() => setSelectedEmployeeDetails(null), 150)
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Employee
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
