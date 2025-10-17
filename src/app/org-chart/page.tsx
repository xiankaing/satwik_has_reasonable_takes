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
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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
  employee: ({ data }: { data: any }) => (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm min-w-[200px]">
      <div className="text-center">
        <div className="font-semibold text-sm">{data.name}</div>
        <div className="text-xs text-gray-600 mt-1">{data.title}</div>
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
  ),
}

export default function OrgChart() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployees()
  }, [])

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

    // Find the root (CEO) - employee with no manager
    const root = employeeData.find(emp => !emp.manager)
    if (!root) return

    // Create nodes
    employeeData.forEach((employee) => {
      const node: Node = {
        id: employee.id,
        type: 'employee',
        data: {
          ...employee,
          onClick: () => setSelectedEmployee(employee),
        },
        position: { x: 0, y: 0 }, // Will be calculated
      }
      nodeMap.set(employee.id, node)
    })

    // Create edges and calculate positions
    const visited = new Set<string>()
    const queue: { employee: Employee; level: number; parentX?: number }[] = [
      { employee: root, level: 0 }
    ]

    const levelWidths = new Map<number, number>()
    const levelCounts = new Map<number, number>()

    while (queue.length > 0) {
      const { employee, level, parentX } = queue.shift()!
      
      if (visited.has(employee.id)) continue
      visited.add(employee.id)

      // Calculate position
      const levelWidth = levelWidths.get(level) || 0
      const levelCount = levelCounts.get(level) || 0
      
      const x = level * 300
      const y = levelCount * 150
      
      positions.set(employee.id, { x, y })
      
      const node = nodeMap.get(employee.id)!
      node.position = { x, y }
      
      levelWidths.set(level, Math.max(levelWidth, x + 200))
      levelCounts.set(level, levelCount + 1)

      // Add edge to manager
      if (employee.manager) {
        edgeList.push({
          id: `${employee.manager.id}-${employee.id}`,
          source: employee.manager.id,
          target: employee.id,
          type: 'smoothstep',
        })
      }

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
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedEmployee.name}</h3>
                <p className="text-gray-600">{selectedEmployee.title}</p>
                <p className="text-gray-500">{selectedEmployee.department}</p>
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
                  <strong>Manager:</strong> {selectedEmployee.manager?.name || 'None'}
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
    </div>
  )
}
