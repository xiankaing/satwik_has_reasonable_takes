'use client'

import { useState, useEffect, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowLeft, Edit } from 'lucide-react'

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

const nodeTypes = {
  employee: ({ data }: { data: any }) => {
    const isExecutive = data.department === 'Executive'
    const isManager = data.title.includes('Manager') || data.title.includes('Director') || data.title.includes('Chief')
    
    return (
      <div className={`bg-white border-2 rounded-lg p-4 shadow-sm min-w-[200px] cursor-pointer hover:shadow-md transition-shadow relative ${
        isExecutive 
          ? 'border-blue-300 bg-blue-50' 
          : isManager 
            ? 'border-green-300 bg-green-50' 
            : 'border-gray-200'
      }`}>
        {/* Source handle for outgoing connections (managers) */}
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          style={{ background: '#374151', width: 8, height: 8 }}
        />
        
        {/* Target handle for incoming connections (reports) */}
        <Handle
          type="target"
          position={Position.Left}
          id="target"
          style={{ background: '#374151', width: 8, height: 8 }}
        />
        
        <div className="text-center">
          <div className={`font-semibold text-sm ${isExecutive ? 'text-blue-900' : isManager ? 'text-green-900' : 'text-gray-900'}`}>
            {data.name}
          </div>
          <div className={`text-xs mt-1 ${isExecutive ? 'text-blue-700' : isManager ? 'text-green-700' : 'text-gray-600'}`}>
            {data.title}
          </div>
          <div className="text-xs text-gray-500">{data.department}</div>
          <div className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
            data.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {data.status}
          </div>
        </div>
      </div>
    )
  },
}

export default function OrgChart() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [highlightedEdges, setHighlightedEdges] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
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
    managerId: 'none',
  })

  const departments = ['Executive', 'Engineering', 'Finance', 'Human Resources']

  useEffect(() => {
    fetchEmployees()
  }, [])

  // Update edge highlighting when highlightedEdges changes
  useEffect(() => {
    if (employees.length > 0) {
      const updatedEdges = edges.map(edge => ({
        ...edge,
        style: {
          ...edge.style,
          stroke: highlightedEdges.includes(edge.id) ? '#dc2626' : '#6b7280',
          strokeWidth: highlightedEdges.includes(edge.id) ? 3 : 2,
        },
      }))
      setEdges(updatedEdges)
    }
  }, [highlightedEdges])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      setEmployees(data)
      buildOrgChart(data)
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildOrgChart = (employeeData: Employee[]) => {
    const nodeMap = new Map<string, Node>()
    const edgeList: Edge[] = []
    const positions = new Map<string, { x: number; y: number }>()

    // Create all nodes first
    employeeData.forEach((employee) => {
      const node: Node = {
        id: employee.id,
        type: 'employee',
        data: {
          ...employee,
        },
        position: { x: 0, y: 0 }, // Will be calculated
      }
      nodeMap.set(employee.id, node)
    })

    // Create edges for all manager-report relationships
    employeeData.forEach((employee) => {
      if (employee.manager) {
        edgeList.push({
          id: `${employee.manager.id}-${employee.id}`,
          source: employee.manager.id,
          sourceHandle: 'source',
          target: employee.id,
          targetHandle: 'target',
          type: 'straight',
          style: {
            stroke: '#6b7280',
            strokeWidth: 2,
          },
        })
      }
    })

    // Find the root (CEO) - employee with no manager
    const root = employeeData.find(emp => !emp.manager)
    if (!root) return

    // Calculate positions using BFS
    const visited = new Set<string>()
    const queue: { employee: Employee; level: number }[] = [
      { employee: root, level: 0 }
    ]

    const levelCounts = new Map<number, number>()

    while (queue.length > 0) {
      const { employee, level } = queue.shift()!
      
      if (visited.has(employee.id)) continue
      visited.add(employee.id)

      // Calculate position
      const levelCount = levelCounts.get(level) || 0
      
      const x = level * 350
      const y = levelCount * 180
      
      positions.set(employee.id, { x, y })
      
      const node = nodeMap.get(employee.id)!
      node.position = { x, y }
      
      levelCounts.set(level, levelCount + 1)

      // Add direct reports to queue
      const reports = employeeData.filter(emp => emp.manager?.id === employee.id)
      reports.forEach(report => {
        queue.push({ employee: report, level: level + 1 })
      })
    }

    setNodes(Array.from(nodeMap.values()))
    setEdges(edgeList)
  }

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const employee = employees.find(emp => emp.id === node.id)
    if (employee) {
      setSelectedEmployee(employee)
      // Highlight edges related to this employee
      const relatedEdges: string[] = []
      
      // Add edge from this employee to their manager
      if (employee.manager) {
        relatedEdges.push(`${employee.manager.id}-${employee.id}`)
      }
      
      // Add edges from this employee to their direct reports
      const directReports = employees.filter(emp => emp.manager?.id === employee.id)
      directReports.forEach(report => {
        relatedEdges.push(`${employee.id}-${report.id}`)
      })
      
      setHighlightedEdges(relatedEdges)
    }
  }, [employees])

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
      managerId: employee.manager?.id || 'none',
    })
    setIsEditDialogOpen(true)
    setSelectedEmployee(null) // Close the details dialog
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return

    try {
      const submitData = {
        ...formData,
        managerId: formData.managerId === 'none' ? '' : formData.managerId,
      }
      
      const response = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        setIsEditDialogOpen(false)
        setEditingEmployee(null)
        fetchEmployees() // Refresh the org chart
      }
    } catch (error) {
      console.error('Error saving employee:', error)
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
      managerId: 'none',
    })
  }

  if (loading) {
    return <div className="p-6">Loading organizational chart...</div>
  }

  return (
    <div className="h-screen w-full">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Link href="/employees">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Directory
          </Button>
        </Link>
        {highlightedEdges.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setHighlightedEdges([])}
          >
            Clear Highlights
          </Button>
        )}
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          type: 'straight',
          style: {
            stroke: '#6b7280',
            strokeWidth: 2,
          },
        }}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Employee Details
              {selectedEmployee && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(selectedEmployee)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedEmployee.name}</h3>
                <p className="text-gray-600">{selectedEmployee.title}</p>
                <p className="text-gray-500">{selectedEmployee.department}</p>
              </div>
              
              {/* Reporting Relationships */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-2">Reporting Relationships</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Reports to:</strong> 
                    <span className="ml-2">
                      {selectedEmployee.manager ? (
                        <span className="text-blue-600">{selectedEmployee.manager.name} ({selectedEmployee.manager.title})</span>
                      ) : (
                        <span className="text-gray-500">No manager (Top level)</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <strong>Direct reports:</strong>
                    <div className="ml-2 mt-1">
                      {employees.filter(emp => emp.manager?.id === selectedEmployee.id).length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {employees.filter(emp => emp.manager?.id === selectedEmployee.id).map(report => (
                            <li key={report.id} className="text-green-600">
                              {report.name} ({report.title})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-500">No direct reports</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Email:</strong> {selectedEmployee.email}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedEmployee.phone || 'N/A'}
                </div>
                <div>
                  <strong>Hire Date:</strong> {new Date(selectedEmployee.hireDate).toLocaleDateString()}
                </div>
                <div>
                  <strong>Salary:</strong> ${selectedEmployee.salary.toLocaleString()}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    selectedEmployee.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedEmployee.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
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
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="manager">Manager</Label>
              <Select
                value={formData.managerId}
                onValueChange={(value) => setFormData({ ...formData, managerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manager</SelectItem>
                  {employees
                    .filter(emp => emp.id !== editingEmployee?.id)
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} ({emp.title})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
