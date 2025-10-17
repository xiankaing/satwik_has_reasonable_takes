import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const pnlRecords = await prisma.employeePnL.findMany({
      where: { employeeId: id },
      orderBy: { year: 'asc' },
    })

    // Calculate summary metrics
    const totalRevenue = pnlRecords.reduce((sum, record) => sum + record.attributedRevenue, 0)
    const totalCost = pnlRecords.reduce((sum, record) => sum + record.totalCost, 0)
    const netProfit = totalRevenue - totalCost
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0

    const summary = {
      totalRevenue,
      totalCost,
      netProfit,
      roi,
      yearsCount: pnlRecords.length,
    }

    return NextResponse.json({
      records: pnlRecords,
      summary,
    })
  } catch (error) {
    console.error('Error fetching employee P&L:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employee P&L data' },
      { status: 500 }
    )
  }
}
