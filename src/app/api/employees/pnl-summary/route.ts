import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get all employees with manager info
    const employees = await prisma.employee.findMany({
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            title: true
          }
        }
      }
    })

    // Get all P&L records in one query (using type assertion to bypass TypeScript issue)
    const allPnlRecords = await (prisma as any).employeePnL.findMany({
      orderBy: { year: 'asc' }
    })

    // Group P&L records by employee ID
    const pnlByEmployee = allPnlRecords.reduce((acc: Record<string, any[]>, record: any) => {
      if (!acc[record.employeeId]) {
        acc[record.employeeId] = []
      }
      acc[record.employeeId].push(record)
      return acc
    }, {} as Record<string, any[]>)

    // Calculate P&L summary for each employee
    const employeesWithSummary = employees.map(employee => {
      const records = pnlByEmployee[employee.id] || []
      
      const totalRevenue = records.reduce((sum: number, record: any) => sum + record.attributedRevenue, 0)
      const totalCost = records.reduce((sum: number, record: any) => sum + record.totalCost, 0)
      const netProfit = totalRevenue - totalCost
      const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0

      const pnlSummary = {
        totalRevenue,
        totalCost,
        netProfit,
        roi,
        yearsCount: records.length,
      }

      return {
        ...employee,
        pnlSummary
      }
    })

    return NextResponse.json(employeesWithSummary)
  } catch (error) {
    console.error('Error fetching employees with P&L summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees with P&L summary' },
      { status: 500 }
    )
  }
}
