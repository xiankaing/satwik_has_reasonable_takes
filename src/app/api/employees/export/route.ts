import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        manager: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Convert to CSV format
    const csvHeader = [
      'Name',
      'Title',
      'Department',
      'Email',
      'Phone',
      'Hire Date',
      'Salary',
      'Status',
      'Manager',
    ].join(',')

    const csvRows = employees.map((employee) => [
      `"${employee.name}"`,
      `"${employee.title}"`,
      `"${employee.department}"`,
      `"${employee.email}"`,
      `"${employee.phone || ''}"`,
      `"${employee.hireDate.toISOString().split('T')[0]}"`,
      employee.salary.toString(),
      `"${employee.status}"`,
      `"${employee.manager?.name || ''}"`,
    ].join(','))

    const csvContent = [csvHeader, ...csvRows].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="employees.csv"',
      },
    })
  } catch (error) {
    console.error('Error exporting employees:', error)
    return NextResponse.json(
      { error: 'Failed to export employees' },
      { status: 500 }
    )
  }
}
