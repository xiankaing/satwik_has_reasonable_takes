'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Plus, Search, Download, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Fuse from 'fuse.js'

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
}

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
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

  const fetchAllEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employees')
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

  const searchAndFilterEmployees = useCallback((currentSearchTerm: string, currentDepartmentFilter: string) => {
    if (!allEmployees.length) return

    let filteredData = allEmployees

    // Apply search if there's a search term
    if (currentSearchTerm.trim()) {
      // First, check for exact and partial acronym matches in titles
      const acronymMatches = allEmployees.filter(employee => {
        const titleWords = employee.title.split(' ').map((word: string) => word.charAt(0).toUpperCase())
        const acronym = titleWords.join('')
        const searchUpper = currentSearchTerm.toUpperCase()
        
        // Check if search term starts with acronym or acronym starts with search term
        return acronym.startsWith(searchUpper) || searchUpper.startsWith(acronym)
      })
      
      const fuse = new Fuse(allEmployees, {
        keys: [
          { name: 'name', weight: 0.4 },
          { name: 'title', weight: 0.3 },
          { name: 'email', weight: 0.2 },
          { name: 'department', weight: 0.1 }
        ],
        threshold: currentSearchTerm.length <= 3 ? 0.6 : 0.4, // More lenient for short searches
        includeScore: true,
        minMatchCharLength: 1,
        shouldSort: true,
        findAllMatches: true
      })
      
      const results = fuse.search(currentSearchTerm)
      const fuzzyResults = results.map(result => result.item)
      
      // Combine acronym matches with fuzzy results, prioritizing acronym matches
      const combinedResults = [...acronymMatches, ...fuzzyResults.filter(emp => 
        !acronymMatches.some(acronymEmp => acronymEmp.id === emp.id)
      )]
      
      filteredData = combinedResults
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
      searchAndFilterEmployees(searchTerm, departmentFilter)
    }, 170)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, departmentFilter, searchAndFilterEmployees])

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
  }

  const handleAddNew = () => {
    setEditingEmployee(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const handleExport = () => {
    window.open('/api/employees/export', '_blank')
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

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(employees) && employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.title}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.phone || '-'}</TableCell>
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
                  <div className="flex gap-2">
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

      <div className="mt-6 text-center">
        <Link href="/org-chart">
          <Button variant="outline">View Organizational Chart</Button>
        </Link>
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
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
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
    </div>
  )
}
