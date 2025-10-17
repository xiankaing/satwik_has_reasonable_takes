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
import { Edit, Search, X } from 'lucide-react'
import { searchEmployees } from '@/lib/searchUtils'

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
      <div className={`bg-white border-2 rounded-lg p-4 shadow-sm min-w-[200px] cursor-grab hover:shadow-md transition-shadow relative ${
        isExecutive 
          ? 'border-blue-300 bg-blue-50' 
          : isManager 
            ? 'border-green-300 bg-green-50' 
            : 'border-gray-200'
      } ${data.isDragging ? 'opacity-50 scale-105' : ''} ${data.isDropTarget ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}`}>
        {/* Source handle for outgoing connections (managers) - informational only */}
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          style={{ 
            background: '#9ca3af', 
            width: 6, 
            height: 6,
            border: '1px solid #6b7280',
            cursor: 'not-allowed'
          }}
          isConnectable={false}
        />
        
        {/* Target handle for incoming connections (reports) - informational only */}
        <Handle
          type="target"
          position={Position.Left}
          id="target"
          style={{ 
            background: '#9ca3af', 
            width: 6, 
            height: 6,
            border: '1px solid #6b7280',
            cursor: 'not-allowed'
          }}
          isConnectable={false}
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
  const [editManagerSearchTerm, setEditManagerSearchTerm] = useState('')
  const [filteredEditManagers, setFilteredEditManagers] = useState<Employee[]>([])
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
  
  // Drag and drop state
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null)
  const [dropTarget, setDropTarget] = useState<Employee | null>(null)
  const [isDragOverlayVisible, setIsDragOverlayVisible] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [pendingManagerChange, setPendingManagerChange] = useState<{
    employee: Employee
    newManager: Employee | null
  } | null>(null)

  const departments = ['Executive', 'Engineering', 'Finance', 'Human Resources']

  useEffect(() => {
    fetchEmployees()
  }, [])

  // Clean up drag state when employees change
  useEffect(() => {
    if (employees.length > 0) {
      setDraggedEmployee(null)
      setDropTarget(null)
      setPendingManagerChange(null)
      setIsDragOverlayVisible(false)
      setIsConfirmDialogOpen(false)
    }
  }, [employees])


  // Filter managers for edit dialog based on search term
  useEffect(() => {
    if (!employees.length || !editingEmployee) {
      setFilteredEditManagers([])
      return
    }

    const availableManagers = employees.filter(emp => emp.id !== editingEmployee.id)
    const searchResults = searchEmployees(availableManagers, editManagerSearchTerm)
    setFilteredEditManagers(searchResults)
  }, [employees, editingEmployee, editManagerSearchTerm])

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

    // Find all top-level employees (those with no manager)
    const topLevelEmployees = employeeData.filter(emp => !emp.manager)
    if (topLevelEmployees.length === 0) return

    // Calculate positions using BFS starting from all top-level employees
    const visited = new Set<string>()
    const queue: { employee: Employee; level: number }[] = []
    
    // Add all top-level employees to the queue
    topLevelEmployees.forEach((employee, index) => {
      queue.push({ employee, level: 0 })
    })

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
    (params: Connection) => {
      // Disable line drawing - reporting relationships should only be changed through the edit dialog
      console.log('Line drawing disabled - use edit dialog to change reporting relationships')
    },
    []
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Clear any pending drag state first
    if (draggedEmployee || dropTarget || pendingManagerChange) {
      console.log('Clearing drag state on node click')
      setDraggedEmployee(null)
      setDropTarget(null)
      setPendingManagerChange(null)
      setIsDragOverlayVisible(false)
      setIsConfirmDialogOpen(false)
    }
    
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
  }, [employees, draggedEmployee, dropTarget, pendingManagerChange])

  // Drag and drop handlers
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    const employee = employees.find(emp => emp.id === node.id)
    console.log('Drag start:', employee?.name)
    if (employee) {
      setDraggedEmployee(employee)
      setIsDragOverlayVisible(true)
      
      // Update node data to show dragging state
      setNodes(prevNodes => 
        prevNodes.map(n => ({
          ...n,
          data: {
            ...n.data,
            isDragging: n.id === node.id
          }
        }))
      )
    }
  }, [employees, setNodes])

  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    // Use ReactFlow's node positions to find overlapping nodes
    const draggedNode = node
    const threshold = 50 // pixels - only trigger on actual overlap
    
    // Find the closest node by comparing positions
    let closestTarget: string | null = null
    let minDistance = Infinity
    
    nodes.forEach(otherNode => {
      if (otherNode.id !== draggedNode.id) {
        const distance = Math.sqrt(
          Math.pow(draggedNode.position.x - otherNode.position.x, 2) + 
          Math.pow(draggedNode.position.y - otherNode.position.y, 2)
        )
        
        if (distance < threshold && distance < minDistance) {
          minDistance = distance
          closestTarget = otherNode.id
        }
      }
    })
    
    if (closestTarget) {
      const targetEmployee = employees.find(emp => emp.id === closestTarget)
      
      if (targetEmployee && targetEmployee.id !== draggedEmployee?.id) {
        if (dropTarget?.id !== targetEmployee.id) {
          console.log('Drop target changed to:', targetEmployee.name)
          setDropTarget(targetEmployee)
        }
        
        // Update nodes to show drop target highlighting
        setNodes(prevNodes => 
          prevNodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              isDropTarget: n.id === closestTarget
            }
          }))
        )
      }
    } else {
      if (dropTarget) {
        console.log('Clearing drop target')
        setDropTarget(null)
      }
      setNodes(prevNodes => 
        prevNodes.map(n => ({
          ...n,
          data: {
            ...n.data,
            isDropTarget: false
          }
        }))
      )
    }
  }, [employees, draggedEmployee, dropTarget, setNodes, nodes])

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    const employee = employees.find(emp => emp.id === node.id)
    
    console.log('Drag stop:', { employee: employee?.name, dropTarget: dropTarget?.name })
    
    // Fallback: If no drop target was detected during drag, try to find one now
    let finalDropTarget = dropTarget
    if (!finalDropTarget) {
      const draggedNode = node
      const threshold = 60 // slightly larger threshold for final detection, but still tight
      
      let closestTarget: string | null = null
      let minDistance = Infinity
      
      nodes.forEach(otherNode => {
        if (otherNode.id !== draggedNode.id) {
          const distance = Math.sqrt(
            Math.pow(draggedNode.position.x - otherNode.position.x, 2) + 
            Math.pow(draggedNode.position.y - otherNode.position.y, 2)
          )
          
          if (distance < threshold && distance < minDistance) {
            minDistance = distance
            closestTarget = otherNode.id
          }
        }
      })
      
      if (closestTarget) {
        finalDropTarget = employees.find(emp => emp.id === closestTarget) || null
        console.log('Fallback drop target detected:', finalDropTarget?.name)
      }
    }
    
    if (employee && finalDropTarget && finalDropTarget.id !== employee.id) {
      // Check for circular relationship
      const wouldCreateCircular = checkCircularRelationship(employee, finalDropTarget, employees)
      
      if (!wouldCreateCircular) {
        console.log('Opening confirmation dialog for:', employee.name, '->', finalDropTarget.name)
        setPendingManagerChange({
          employee,
          newManager: finalDropTarget
        })
        setIsConfirmDialogOpen(true)
      } else {
        console.log('Circular relationship prevented')
        alert('Cannot create circular reporting relationship!')
      }
    } else {
      console.log('No valid drop target or same employee')
    }
    
    // Always reset drag state, regardless of whether there was a valid drop
    setDraggedEmployee(null)
    setDropTarget(null)
    setIsDragOverlayVisible(false)
    // Don't reset pendingManagerChange here - only reset it when dialog is closed
    
    setNodes(prevNodes => 
      prevNodes.map(n => ({
        ...n,
        data: {
          ...n.data,
          isDragging: false,
          isDropTarget: false
        }
      }))
    )
  }, [employees, dropTarget, setNodes])

  // Helper function to check for circular relationships
  const checkCircularRelationship = (employee: Employee, newManager: Employee, allEmployees: Employee[]): boolean => {
    if (employee.id === newManager.id) return true
    
    // Check if the new manager is a direct or indirect report of the employee
    const checkReports = (managerId: string, targetId: string): boolean => {
      const directReports = allEmployees.filter(emp => emp.manager?.id === managerId)
      
      for (const report of directReports) {
        if (report.id === targetId) return true
        if (checkReports(report.id, targetId)) return true
      }
      return false
    }
    
    return checkReports(employee.id, newManager.id)
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
      managerId: employee.manager?.id || 'none',
    })
    setEditManagerSearchTerm('') // Reset search term
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

  // Handle confirmation of manager change
  const handleConfirmManagerChange = async () => {
    if (!pendingManagerChange) return

    try {
      const response = await fetch(`/api/employees/${pendingManagerChange.employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          managerId: pendingManagerChange.newManager?.id || null,
        }),
      })

      if (response.ok) {
        setIsConfirmDialogOpen(false)
        setPendingManagerChange(null)
        fetchEmployees() // Refresh the org chart
      } else {
        alert('Failed to update reporting relationship')
      }
    } catch (error) {
      console.error('Error updating manager:', error)
      alert('Failed to update reporting relationship')
    }
  }

  const handleCancelManagerChange = () => {
    setIsConfirmDialogOpen(false)
    setPendingManagerChange(null)
  }

  if (loading) {
    return <div className="p-6">Loading organizational chart...</div>
  }

  return (
    <div className="h-screen w-full">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {highlightedEdges.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setHighlightedEdges([])}
          >
            Clear Highlights
          </Button>
        )}
        {isDragOverlayVisible && draggedEmployee && (
          <div className="bg-blue-100 border border-blue-300 rounded-md px-3 py-2 text-sm text-blue-800">
            Dragging: {draggedEmployee.name}
          </div>
        )}
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
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
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
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
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(selectedEmployee)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
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
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <form id="edit-employee-form" onSubmit={handleSubmit} className="space-y-4 pr-2">
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
              
              {/* Search input */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search managers..."
                  value={editManagerSearchTerm}
                  onChange={(e) => setEditManagerSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {editManagerSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setEditManagerSearchTerm('')}
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
                    onClick={() => setFormData({ ...formData, managerId: 'none' })}
                    className={`w-full text-left p-2 rounded hover:bg-gray-100 ${
                      formData.managerId === 'none' ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    <div className="font-medium">No manager (Top level)</div>
                  </button>
                </div>
                
                {/* Show current manager at the top of search results if it exists */}
                {editingEmployee?.manager && (
                  <div className="p-2 border-t">
                    <div className="text-xs text-green-600 font-medium mb-1">Current Manager</div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, managerId: editingEmployee.manager!.id })}
                      className={`w-full text-left p-2 rounded hover:bg-gray-100 ${
                        formData.managerId === editingEmployee.manager.id ? 'bg-blue-50 text-blue-700' : 'bg-green-50'
                      }`}
                    >
                      <div className="font-medium">{editingEmployee.manager.name}</div>
                      <div className="text-sm text-gray-600">{editingEmployee.manager.title}</div>
                    </button>
                  </div>
                )}
                
                {filteredEditManagers
                  .filter(emp => emp.id !== editingEmployee?.manager?.id) // Exclude current manager from regular results
                  .map((emp) => (
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
                
                {filteredEditManagers.length === 0 && editManagerSearchTerm && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No managers found matching "{editManagerSearchTerm}"
                  </div>
                )}
              </div>
            </div>
            </form>
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" form="edit-employee-form" className="flex-1">
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
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Manager Change */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Reporting Relationship Change</DialogTitle>
          </DialogHeader>
          {pendingManagerChange && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to make <strong>{pendingManagerChange.employee.name}</strong> report to{' '}
                <strong>{pendingManagerChange.newManager?.name || 'no one (top level)'}</strong>?
              </p>
              
              {pendingManagerChange.employee.manager && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Current manager:</strong> {pendingManagerChange.employee.manager.name}
                  </p>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>New manager:</strong> {pendingManagerChange.newManager?.name || 'No manager (Top level)'}
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleConfirmManagerChange} className="flex-1">
              Confirm Change
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelManagerChange}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
