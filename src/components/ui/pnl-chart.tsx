'use client'

import { useEffect, useRef } from 'react'

interface PnLRecord {
  id: string
  year: number
  attributedRevenue: number
  totalCost: number
}

interface PnLChartProps {
  records: PnLRecord[]
  width?: number
  height?: number
}

export function PnLChart({ records, width = 600, height = 350 }: PnLChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || records.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Calculate data ranges
    const years = records.map(r => r.year)
    const revenues = records.map(r => r.attributedRevenue)
    const costs = records.map(r => r.totalCost)
    
    const minYear = Math.min(...years)
    const maxYear = Math.max(...years)
    const maxValue = Math.max(...revenues, ...costs)

    // Chart dimensions
    const padding = 60
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Draw axes
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    
    // Y-axis
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.stroke()
    
    // X-axis
    ctx.beginPath()
    ctx.moveTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()

    // Draw grid lines
    ctx.strokeStyle = '#f3f4f6'
    ctx.lineWidth = 0.5
    for (let i = 1; i <= 4; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Draw revenue line
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    records.forEach((record, index) => {
      const x = padding + (chartWidth / (records.length - 1)) * index
      const y = height - padding - (record.attributedRevenue / maxValue) * chartHeight
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw cost line
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    records.forEach((record, index) => {
      const x = padding + (chartWidth / (records.length - 1)) * index
      const y = height - padding - (record.totalCost / maxValue) * chartHeight
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw data points
    ctx.fillStyle = '#10b981'
    records.forEach((record, index) => {
      const x = padding + (chartWidth / (records.length - 1)) * index
      const y = height - padding - (record.attributedRevenue / maxValue) * chartHeight
      
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })

    ctx.fillStyle = '#ef4444'
    records.forEach((record, index) => {
      const x = padding + (chartWidth / (records.length - 1)) * index
      const y = height - padding - (record.totalCost / maxValue) * chartHeight
      
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Draw labels
    ctx.fillStyle = '#374151'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    
    // Year labels
    records.forEach((record, index) => {
      const x = padding + (chartWidth / (records.length - 1)) * index
      ctx.fillText(record.year.toString(), x, height - padding + 20)
    })

    // Value labels on Y-axis
    ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const value = (maxValue / 4) * i
      const y = height - padding - (chartHeight / 4) * i
      ctx.fillText(`$${(value / 1000).toFixed(0)}K`, padding - 15, y + 5)
    }

    // Legend
    ctx.textAlign = 'left'
    ctx.fillStyle = '#10b981'
    ctx.fillText('Revenue', width - 120, 20)
    ctx.fillStyle = '#ef4444'
    ctx.fillText('Cost', width - 120, 40)

  }, [records, width, height])

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No P&L data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">P&L Trend</h3>
      <div className="w-full overflow-x-auto">
        <canvas ref={canvasRef} className="w-full max-w-full" />
      </div>
    </div>
  )
}
