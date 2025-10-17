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

  console.log('Seed data created successfully!')
  console.log(`Created ${await prisma.employee.count()} employees`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
