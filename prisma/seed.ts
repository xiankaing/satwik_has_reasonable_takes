import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.employee.deleteMany()

  // Create employees with realistic org hierarchy
  const ceo = await prisma.employee.create({
    data: {
      name: 'Sarah Johnson',
      title: 'Chief Executive Officer',
      department: 'Executive',
      email: 'sarah.johnson@company.com',
      phone: '+1-555-0101',
      hireDate: new Date('2020-01-15'),
      salary: 250000,
      status: 'active',
    },
  })

  const cto = await prisma.employee.create({
    data: {
      name: 'Michael Chen',
      title: 'Chief Technology Officer',
      department: 'Engineering',
      email: 'michael.chen@company.com',
      phone: '+1-555-0102',
      hireDate: new Date('2020-03-01'),
      salary: 200000,
      status: 'active',
      managerId: ceo.id,
    },
  })

  const cfo = await prisma.employee.create({
    data: {
      name: 'Emily Rodriguez',
      title: 'Chief Financial Officer',
      department: 'Finance',
      email: 'emily.rodriguez@company.com',
      phone: '+1-555-0103',
      hireDate: new Date('2020-02-15'),
      salary: 180000,
      status: 'active',
      managerId: ceo.id,
    },
  })

  const hrDirector = await prisma.employee.create({
    data: {
      name: 'David Kim',
      title: 'Director of Human Resources',
      department: 'Human Resources',
      email: 'david.kim@company.com',
      phone: '+1-555-0104',
      hireDate: new Date('2020-04-01'),
      salary: 120000,
      status: 'active',
      managerId: ceo.id,
    },
  })

  // Engineering managers
  const engManager1 = await prisma.employee.create({
    data: {
      name: 'Lisa Wang',
      title: 'Engineering Manager',
      department: 'Engineering',
      email: 'lisa.wang@company.com',
      phone: '+1-555-0105',
      hireDate: new Date('2021-01-15'),
      salary: 140000,
      status: 'active',
      managerId: cto.id,
    },
  })

  const engManager2 = await prisma.employee.create({
    data: {
      name: 'James Wilson',
      title: 'Engineering Manager',
      department: 'Engineering',
      email: 'james.wilson@company.com',
      phone: '+1-555-0106',
      hireDate: new Date('2021-02-01'),
      salary: 135000,
      status: 'active',
      managerId: cto.id,
    },
  })

  // Finance team
  const financeManager = await prisma.employee.create({
    data: {
      name: 'Maria Garcia',
      title: 'Finance Manager',
      department: 'Finance',
      email: 'maria.garcia@company.com',
      phone: '+1-555-0107',
      hireDate: new Date('2021-03-01'),
      salary: 95000,
      status: 'active',
      managerId: cfo.id,
    },
  })

  // Individual contributors
  const developers = [
    {
      name: 'Alex Thompson',
      title: 'Senior Software Engineer',
      department: 'Engineering',
      email: 'alex.thompson@company.com',
      phone: '+1-555-0108',
      hireDate: new Date('2021-06-01'),
      salary: 110000,
      managerId: engManager1.id,
    },
    {
      name: 'Jessica Lee',
      title: 'Software Engineer',
      department: 'Engineering',
      email: 'jessica.lee@company.com',
      phone: '+1-555-0109',
      hireDate: new Date('2022-01-15'),
      salary: 85000,
      managerId: engManager1.id,
    },
    {
      name: 'Robert Brown',
      title: 'Senior Software Engineer',
      department: 'Engineering',
      email: 'robert.brown@company.com',
      phone: '+1-555-0110',
      hireDate: new Date('2021-08-01'),
      salary: 105000,
      managerId: engManager2.id,
    },
    {
      name: 'Amanda Davis',
      title: 'Software Engineer',
      department: 'Engineering',
      email: 'amanda.davis@company.com',
      phone: '+1-555-0111',
      hireDate: new Date('2022-03-01'),
      salary: 80000,
      managerId: engManager2.id,
    },
  ]

  for (const dev of developers) {
    await prisma.employee.create({ data: dev })
  }

  // Finance team members
  const financeAnalyst = await prisma.employee.create({
    data: {
      name: 'Kevin Park',
      title: 'Financial Analyst',
      department: 'Finance',
      email: 'kevin.park@company.com',
      phone: '+1-555-0112',
      hireDate: new Date('2022-05-01'),
      salary: 65000,
      status: 'active',
      managerId: financeManager.id,
    },
  })

  // HR team member
  const hrSpecialist = await prisma.employee.create({
    data: {
      name: 'Rachel Green',
      title: 'HR Specialist',
      department: 'Human Resources',
      email: 'rachel.green@company.com',
      phone: '+1-555-0113',
      hireDate: new Date('2022-07-01'),
      salary: 60000,
      status: 'active',
      managerId: hrDirector.id,
    },
  })

  // Generate P&L data for all employees
  const employees = await prisma.employee.findMany()
  const currentYear = new Date().getFullYear()
  
  for (const employee of employees) {
    const hireYear = employee.hireDate.getFullYear()
    const yearsWorked = currentYear - hireYear + 1 // Include current year
    
    // Determine revenue attribution based on role
    let baseRevenue: number
    let growthRate: number
    
    if (employee.title.includes('Chief') || employee.title.includes('CEO')) {
      baseRevenue = 3000000 // $3M base for executives
      growthRate = 0.12 // 12% growth
    } else if (employee.title.includes('Director') || employee.title.includes('Manager')) {
      baseRevenue = 1000000 // $1M base for managers
      growthRate = 0.10 // 10% growth
    } else if (employee.title.includes('Senior')) {
      baseRevenue = 600000 // $600K base for senior roles
      growthRate = 0.08 // 8% growth
    } else {
      baseRevenue = 300000 // $300K base for junior roles
      growthRate = 0.15 // 15% growth (higher growth potential)
    }
    
    // Generate P&L records for each year
    for (let yearOffset = 0; yearOffset < yearsWorked; yearOffset++) {
      const year = hireYear + yearOffset
      
      // Calculate revenue with growth and some randomness
      const growthFactor = Math.pow(1 + growthRate, yearOffset)
      const randomFactor = 0.9 + Math.random() * 0.2 // ±10% variance
      const attributedRevenue = baseRevenue * growthFactor * randomFactor
      
      // Calculate total cost (salary + 40% overhead for benefits, equipment, etc.)
      const totalCost = employee.salary * 1.4
      
      // Add some notes for context
      const notes = yearOffset === 0 
        ? `First year - ${employee.title}`
        : `Year ${yearOffset + 1} - Performance impact`
      
      await prisma.employeePnL.create({
        data: {
          employeeId: employee.id,
          year,
          attributedRevenue: Math.round(attributedRevenue),
          totalCost: Math.round(totalCost),
          notes,
        },
      })
    }
  }
  
  console.log('Seed data created successfully!')
  console.log(`Created ${await prisma.employee.count()} employees`)
  console.log(`Created ${await prisma.employeePnL.count()} P&L records`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
