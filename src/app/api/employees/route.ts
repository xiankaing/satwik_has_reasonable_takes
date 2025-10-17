import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const department = searchParams.get('department')

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (department) {
      where.department = department
    }

    const employees = await prisma.employee.findMany({
      where,
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
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const employee = await prisma.employee.create({
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

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}
