import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with initial data...')
  
  try {

  import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Starting database seeding...')

    // Create Roles
    console.log('
📋 Creating roles...')
  console.log('Creating roles...')
  
  const roles = [
    {
      name: 'Admin',
      description: 'System administrator with full access to all features'
    },
    {
      name: 'Teacher',
      description: 'Teaching personnel with access to leave management and teaching resources'
    },
    {
      name: 'Non Teaching Personnel',
      description: 'Non-teaching staff with access to basic features'
    },
    {
      name: 'Dean/Program Head',
      description: 'Department heads with approval authority and department management capabilities'
    },
    {
      name: 'Finance Department',
      description: 'Finance staff with access to payroll and financial features'
    },
    {
      name: 'HR Department',
      description: 'Human resources staff with access to employee management features'
    },
    {
      name: 'Registrar',
      description: 'Registrar staff with access to academic records and enrollment'
    }
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: {
        name: role.name,
        description: role.description
      }
    })
    console.log(`✅ Created role: ${role.name}`)
  }

  // Store roles for reference
  const adminRole = await prisma.role.findUnique({
    where: { name: 'Admin' }
  })

  const nonTeachingRole = await prisma.role.findUnique({
    where: { name: 'Non Teaching Personnel' },
    update: {},
    create: {
      name: 'Non Teaching Personnel',
      description: 'Non-teaching staff members'
    }
  })

  const deanRole = await prisma.role.upsert({
    where: { name: 'Dean/Program Head' },
    update: {},
    create: {
      name: 'Dean/Program Head',
      description: 'Department dean or program head'
    }
  })

  const financeRole = await prisma.role.upsert({
    where: { name: 'Finance Department' },
    update: {},
    create: {
      name: 'Finance Department',
      description: 'Finance department staff'
    }
  })

  const teacherRole = await prisma.role.upsert({
    where: { name: 'Teacher/Instructor' },
    update: {},
    create: {
      name: 'Teacher/Instructor',
      description: 'Teaching faculty and instructors'
    }
  })

  // Create Statuses
  const probationStatus = await prisma.status.upsert({
    where: { name: 'Probation' },
    update: {},
    create: {
      name: 'Probation',
      description: 'Employee under probationary period'
    }
  })

  const regularStatus = await prisma.status.upsert({
    where: { name: 'Regular' },
    update: {},
    create: {
      name: 'Regular',
      description: 'Regular employee'
    }
  })

  // Create Non-Teaching Departments
  const guidanceOffice = await prisma.department.upsert({
    where: { name: 'Guidance Office' },
    update: {},
    create: {
      name: 'Guidance Office',
      description: 'Student guidance and counseling services',
      category: 'NON_TEACHING_PERSONNEL'
    }
  })

  const maintenanceOffice = await prisma.department.upsert({
    where: { name: 'Maintenance Office' },
    update: {},
    create: {
      name: 'Maintenance Office',
      description: 'Facility maintenance and operations',
      category: 'NON_TEACHING_PERSONNEL'
    }
  })

  const registrarOffice = await prisma.department.upsert({
    where: { name: 'Registrar Office' },
    update: {},
    create: {
      name: 'Registrar Office',
      description: 'Student records and registration',
      category: 'NON_TEACHING_PERSONNEL'
    }
  })

  const financeOffice = await prisma.department.upsert({
    where: { name: 'Finance Office' },
    update: {},
    create: {
      name: 'Finance Office',
      description: 'Financial operations and accounting',
      category: 'NON_TEACHING_PERSONNEL'
    }
  })

  // Create Academic Departments
  const englishDept = await prisma.department.upsert({
    where: { name: 'Bachelor of Arts in English Literature' },
    update: {},
    create: {
      name: 'Bachelor of Arts in English Literature',
      description: 'English Literature department',
      category: 'ACADEMIC_DEPARTMENT'
    }
  })

  const businessDept = await prisma.department.upsert({
    where: { name: 'Bachelor of Science in Business Administration' },
    update: {},
    create: {
      name: 'Bachelor of Science in Business Administration',
      description: 'Business Administration department',
      category: 'ACADEMIC_DEPARTMENT'
    }
  })

  const csDept = await prisma.department.upsert({
    where: { name: 'Bachelor of Science in Computer Science' },
    update: {},
    create: {
      name: 'Bachelor of Science in Computer Science',
      description: 'Computer Science department',
      category: 'ACADEMIC_DEPARTMENT'
    }
  })

  const criminologyDept = await prisma.department.upsert({
    where: { name: 'Bachelor of Science in Criminology' },
    update: {},
    create: {
      name: 'Bachelor of Science in Criminology',
      description: 'Criminology department',
      category: 'ACADEMIC_DEPARTMENT'
    }
  })

  const educationDept = await prisma.department.upsert({
    where: { name: 'Bachelor of Science in Education' },
    update: {},
    create: {
      name: 'Bachelor of Science in Education',
      description: 'Education department',
      category: 'ACADEMIC_DEPARTMENT'
    }
  })

  const socialWorkDept = await prisma.department.upsert({
    where: { name: 'Bachelor of Science in Social Work' },
    update: {},
    create: {
      name: 'Bachelor of Science in Social Work',
      description: 'Social Work department',
      category: 'ACADEMIC_DEPARTMENT'
    }
  })

  // Create admin user with credentials admin@admin.com / password
  const hashedPassword = await bcrypt.hash('password', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      users_id: '24010001',
      email: 'admin@admin.com',
      password: hashedPassword,
      name: 'System Administrator',
      firstName: 'System',
      lastName: 'Administrator',
      profilePicture: '/ckcm.png',
      role_id: adminRole.role_id,
      status_id: regularStatus.status_id,
      isDepartmentHead: false,
      isEmailVerified: true,
      isActive: true,
    },
  })

  // Create test teacher
  const teacherPassword = await bcrypt.hash('teacher123', 12)
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@oalass.com' },
    update: {},
    create: {
      users_id: '24010002',
      email: 'teacher@oalass.com',
      password: teacherPassword,
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      profilePicture: '/ckcm.png',
      role_id: teacherRole.role_id,
      department_id: csDept.department_id,
      status_id: regularStatus.status_id,
      isDepartmentHead: false,
      isEmailVerified: true,
      isActive: true,
    },
  })

  // Create test finance user
  const financePassword = await bcrypt.hash('finance123', 12)
  const finance = await prisma.user.upsert({
    where: { email: 'finance@oalass.com' },
    update: {},
    create: {
      users_id: '24010003',
      email: 'finance@oalass.com',
      password: financePassword,
      name: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      profilePicture: '/ckcm.png',
      role_id: financeRole.role_id,
      status_id: regularStatus.status_id,
      isDepartmentHead: false,
      isEmailVerified: true,
      isActive: true,
    },
  })

  console.log('✅ Seeding completed!')
  console.log(`👤 Admin User: ${adminUser.email} (Password: password)`)
  console.log(`👨‍🏫 Teacher User: ${teacher.email} (Password: teacher123)`)
  console.log(`💰 Finance User: ${finance.email} (Password: finance123)`)
  console.log(`📊 Created ${await prisma.role.count()} roles`)
  console.log(`🏢 Created ${await prisma.department.count()} departments`)
  console.log(`📋 Created ${await prisma.status.count()} statuses`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
