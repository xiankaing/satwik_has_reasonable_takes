import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Fetch all employees first
    const employees = await prisma.employee.findMany({
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Fetch all P&L records in a single query
    const pnlRecords = await prisma.employeePnL.findMany({
      orderBy: { year: 'asc' },
    })

    // Group P&L records by employee ID
    const pnlByEmployee = pnlRecords.reduce((acc: Record<string, any[]>, record: any) => {
      if (!acc[record.employeeId]) {
        acc[record.employeeId] = []
      }
      acc[record.employeeId].push(record)
      return acc
    }, {} as Record<string, any[]>)

    // Calculate P&L summaries for each employee
    const employeesWithPnL = employees.map(employee => {
      const employeePnlRecords = pnlByEmployee[employee.id] || []
      
      const totalRevenue = employeePnlRecords.reduce((sum: number, record: any) => sum + record.attributedRevenue, 0)
      const totalCost = employeePnlRecords.reduce((sum: number, record: any) => sum + record.totalCost, 0)
      const netProfit = totalRevenue - totalCost
      const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0

      const pnlSummary = {
        totalRevenue,
        totalCost,
        netProfit,
        roi,
        yearsCount: employeePnlRecords.length,
      }

      return {
        ...employee,
        pnlSummary,
      }
    })

    return NextResponse.json(employeesWithPnL)
  } catch (error) {
    console.error('Error fetching employees with P&L summaries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees with P&L summaries' },
      { status: 500 }
    )
  }
}