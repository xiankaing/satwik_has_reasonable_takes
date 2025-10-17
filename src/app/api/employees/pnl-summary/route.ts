import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get all employees with their P&L data in a single query
    const employeesWithPnL = await prisma.employee.findMany({
      include: {
        pnlRecords: {
          orderBy: { year: 'asc' }
        }
      }
    })

    // Calculate P&L summary for each employee
    const employeesWithSummary = employeesWithPnL.map(employee => {
      const records = employee.pnlRecords
      
      const totalRevenue = records.reduce((sum, record) => sum + record.attributedRevenue, 0)
      const totalCost = records.reduce((sum, record) => sum + record.totalCost, 0)
      const netProfit = totalRevenue - totalCost
      const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0

      const pnlSummary = {
        totalRevenue,
        totalCost,
        netProfit,
        roi,
        yearsCount: records.length,
      }

      // Remove the pnlRecords array from the response to keep it clean
      const { pnlRecords, ...employeeData } = employee

      return {
        ...employeeData,
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
