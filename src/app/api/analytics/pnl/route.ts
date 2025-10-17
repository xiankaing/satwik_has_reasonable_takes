import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')
    const yearFrom = searchParams.get('yearFrom')
    const yearTo = searchParams.get('yearTo')

    // Build where clause for filtering
    const where: any = {}
    
    if (department && department !== 'all') {
      where.employee = {
        department: department
      }
    }

    if (yearFrom || yearTo) {
      where.year = {}
      if (yearFrom) where.year.gte = parseInt(yearFrom)
      if (yearTo) where.year.lte = parseInt(yearTo)
    }

    // Get all P&L records with employee data
    const pnlRecords = await prisma.employeePnL.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            title: true,
            department: true,
            salary: true,
          },
        },
      },
      orderBy: { year: 'desc' },
    })

    // Calculate department-level summaries
    const departmentSummary = pnlRecords.reduce((acc, record) => {
      const dept = record.employee.department
      if (!acc[dept]) {
        acc[dept] = {
          totalRevenue: 0,
          totalCost: 0,
          employeeCount: 0,
          employees: new Set(),
        }
      }
      acc[dept].totalRevenue += record.attributedRevenue
      acc[dept].totalCost += record.totalCost
      acc[dept].employees.add(record.employee.id)
      return acc
    }, {} as Record<string, any>)

    // Convert Set to count
    Object.keys(departmentSummary).forEach(dept => {
      departmentSummary[dept].employeeCount = departmentSummary[dept].employees.size
      departmentSummary[dept].netProfit = departmentSummary[dept].totalRevenue - departmentSummary[dept].totalCost
      departmentSummary[dept].roi = departmentSummary[dept].totalCost > 0 
        ? (departmentSummary[dept].netProfit / departmentSummary[dept].totalCost) * 100 
        : 0
      delete departmentSummary[dept].employees
    })

    // Calculate top performers by ROI
    const employeeSummary = pnlRecords.reduce((acc, record) => {
      const empId = record.employee.id
      if (!acc[empId]) {
        acc[empId] = {
          employee: record.employee,
          totalRevenue: 0,
          totalCost: 0,
          yearsCount: 0,
        }
      }
      acc[empId].totalRevenue += record.attributedRevenue
      acc[empId].totalCost += record.totalCost
      acc[empId].yearsCount += 1
      return acc
    }, {} as Record<string, any>)

    // Calculate ROI for each employee and sort
    const topPerformers = Object.values(employeeSummary)
      .map((emp: any) => {
        const netProfit = emp.totalRevenue - emp.totalCost
        return {
          ...emp,
          netProfit,
          roi: emp.totalCost > 0 ? (netProfit / emp.totalCost) * 100 : 0,
        }
      })
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 10)

    // Calculate overall company metrics
    const totalRevenue = pnlRecords.reduce((sum, record) => sum + record.attributedRevenue, 0)
    const totalCost = pnlRecords.reduce((sum, record) => sum + record.totalCost, 0)
    const netProfit = totalRevenue - totalCost
    const overallROI = totalCost > 0 ? (netProfit / totalCost) * 100 : 0

    return NextResponse.json({
      overall: {
        totalRevenue,
        totalCost,
        netProfit,
        roi: overallROI,
        totalRecords: pnlRecords.length,
      },
      departmentSummary,
      topPerformers,
    })
  } catch (error) {
    console.error('Error fetching P&L analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch P&L analytics' },
      { status: 500 }
    )
  }
}
