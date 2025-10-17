import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
        reports: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name: body.name,
        title: body.title,
        department: body.department,
        email: body.email,
        phone: body.phone || null,
        hireDate: new Date(body.hireDate),
        salary: parseFloat(body.salary),
        status: body.status || 'active',
        managerId: body.managerId || null,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.employee.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}
