import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Finance Report Test Data Seeding...')

  try {
    // 1. Create Departments
    console.log('📁 Creating departments...')
    const departments = await Promise.all([
      prisma.department.upsert({
        where: { name: 'Computer Science' },
        update: {},
        create: {
          name: 'Computer Science',
          description: 'Computer Science Department',
          category: 'ACADEMIC_DEPARTMENT'
        }
      }),
      prisma.department.upsert({
        where: { name: 'Mathematics' },
        update: {},
        create: {
          name: 'Mathematics',
          description: 'Mathematics Department',
          category: 'ACADEMIC_DEPARTMENT'
        }
      }),
      prisma.department.upsert({
        where: { name: 'Physics' },
        update: {},
        create: {
          name: 'Physics',
          description: 'Physics Department',
          category: 'ACADEMIC_DEPARTMENT'
        }
      }),
      prisma.department.upsert({
        where: { name: 'Finance Office' },
        update: {},
        create: {
          name: 'Finance Office',
          description: 'Finance and Accounting Department',
          category: 'NON_TEACHING_PERSONNEL'
        }
      }),
      prisma.department.upsert({
        where: { name: 'Human Resources' },
        update: {},
        create: {
          name: 'Human Resources',
          description: 'Human Resources Department',
          category: 'NON_TEACHING_PERSONNEL'
        }
      })
    ])

    // 2. Create Role Categories
    console.log('👥 Creating role categories...')
    const roleCategories = await Promise.all([
      prisma.roleCategory.upsert({
        where: { name: 'Teaching Staff' },
        update: {},
        create: {
          name: 'Teaching Staff',
          description: 'Academic teaching personnel',
          color: '#3b82f6'
        }
      }),
      prisma.roleCategory.upsert({
        where: { name: 'Non Teaching Staff' },
        update: {},
        create: {
          name: 'Non Teaching Staff',
          description: 'Administrative and support staff',
          color: '#10b981'
        }
      }),
      prisma.roleCategory.upsert({
        where: { name: 'Finance' },
        update: {},
        create: {
          name: 'Finance',
          description: 'Finance department personnel',
          color: '#f59e0b'
        }
      })
    ])

    // 3. Create Roles
    console.log('🎭 Creating roles...')
    const roles = await Promise.all([
      prisma.role.upsert({
        where: { name: 'Teacher/Instructor' },
        update: {},
        create: {
          name: 'Teacher/Instructor',
          description: 'Academic instructor',
          category_id: roleCategories[0].category_id
        }
      }),
      prisma.role.upsert({
        where: { name: 'Department Head' },
        update: {},
        create: {
          name: 'Department Head',
          description: 'Department head',
          category_id: roleCategories[0].category_id
        }
      }),
      prisma.role.upsert({
        where: { name: 'Finance Officer' },
        update: {},
        create: {
          name: 'Finance Officer',
          description: 'Finance department officer',
          category_id: roleCategories[2].category_id
        }
      }),
      prisma.role.upsert({
        where: { name: 'Non Teaching Personnel' },
        update: {},
        create: {
          name: 'Non Teaching Personnel',
          description: 'Administrative staff',
          category_id: roleCategories[1].category_id
        }
      })
    ])

    // 4. Create Statuses
    console.log('📊 Creating statuses...')
    const statuses = await Promise.all([
      prisma.status.upsert({
        where: { name: 'Regular' },
        update: {},
        create: {
          name: 'Regular',
          description: 'Regular employee status'
        }
      }),
      prisma.status.upsert({
        where: { name: 'Probation' },
        update: {},
        create: {
          name: 'Probation',
          description: 'Probationary employee status'
        }
      })
    ])

    // 5. Create Term Types
    console.log('📅 Creating term types...')
    const termTypes = await Promise.all([
      prisma.termType.upsert({
        where: { name: 'First Semester' },
        update: {},
        create: {
          name: 'First Semester',
          description: 'First semester of academic year',
          isActive: true
        }
      }),
      prisma.termType.upsert({
        where: { name: 'Second Semester' },
        update: {},
        create: {
          name: 'Second Semester',
          description: 'Second semester of academic year',
          isActive: true
        }
      }),
      prisma.termType.upsert({
        where: { name: 'Summer' },
        update: {},
        create: {
          name: 'Summer',
          description: 'Summer term',
          isActive: true
        }
      })
    ])

    // 6. Create Calendar Periods
    console.log('🗓️ Creating calendar periods...')
    const currentYear = new Date().getFullYear()
    
    // Check if calendar periods already exist
    const existingPeriods = await prisma.calendarPeriod.findMany({
      where: {
        academicYear: `${currentYear}-${currentYear + 1}`
      }
    })
    
    let calendarPeriods
    if (existingPeriods.length === 0) {
      calendarPeriods = await Promise.all([
        prisma.calendarPeriod.create({
          data: {
            academicYear: `${currentYear}-${currentYear + 1}`,
            startDate: new Date(`${currentYear}-08-01`),
            endDate: new Date(`${currentYear}-12-15`),
            isCurrent: true,
            isActive: true,
            term_type_id: termTypes[0].term_type_id
          }
        }),
        prisma.calendarPeriod.create({
          data: {
            academicYear: `${currentYear}-${currentYear + 1}`,
            startDate: new Date(`${currentYear + 1}-01-15`),
            endDate: new Date(`${currentYear + 1}-05-30`),
            isCurrent: false,
            isActive: true,
            term_type_id: termTypes[1].term_type_id
          }
        })
      ])
    } else {
      calendarPeriods = existingPeriods
    }

    // 7. Create Leave Types
    console.log('🏖️ Creating leave types...')
    const leaveTypes = await Promise.all([
      prisma.leave_types.upsert({
        where: { name: 'Sick Leave' },
        update: {},
        create: {
          name: 'Sick Leave',
          description: 'Medical leave for illness',
          isActive: true,
          exempt_from_date_restriction: false
        }
      }),
      prisma.leave_types.upsert({
        where: { name: 'Vacation Leave' },
        update: {},
        create: {
          name: 'Vacation Leave',
          description: 'Personal vacation time',
          isActive: true,
          exempt_from_date_restriction: false
        }
      }),
      prisma.leave_types.upsert({
        where: { name: 'Emergency Leave' },
        update: {},
        create: {
          name: 'Emergency Leave',
          description: 'Emergency personal leave',
          isActive: true,
          exempt_from_date_restriction: true
        }
      }),
      prisma.leave_types.upsert({
        where: { name: 'Maternity Leave' },
        update: {},
        create: {
          name: 'Maternity Leave',
          description: 'Maternity leave for new mothers',
          isActive: true,
          exempt_from_date_restriction: false
        }
      }),
      prisma.leave_types.upsert({
        where: { name: 'Study Leave' },
        update: {},
        create: {
          name: 'Study Leave',
          description: 'Leave for academic study',
          isActive: true,
          exempt_from_date_restriction: false
        }
      })
    ])

    // 8. Create Test Users
    console.log('👤 Creating test users...')
    const hashedPassword = await hash('password123', 12)
    
    const users = await Promise.all([
      // Finance Users
      prisma.user.upsert({
        where: { email: 'finance.officer@ckcm.edu' },
        update: {},
        create: {
          users_id: 'FIN001',
          email: 'finance.officer@ckcm.edu',
          password: hashedPassword,
          name: 'Sarah Johnson',
          firstName: 'Sarah',
          lastName: 'Johnson',
          isEmailVerified: true,
          isActive: true,
          department_id: departments[3].department_id,
          role_id: roles[2].role_id,
          status_id: statuses[0].status_id
        }
      }),
      prisma.user.upsert({
        where: { email: 'finance.head@ckcm.edu' },
        update: {},
        create: {
          users_id: 'FIN002',
          email: 'finance.head@ckcm.edu',
          password: hashedPassword,
          name: 'Michael Chen',
          firstName: 'Michael',
          lastName: 'Chen',
          isEmailVerified: true,
          isActive: true,
          department_id: departments[3].department_id,
          role_id: roles[2].role_id,
          status_id: statuses[0].status_id
        }
      }),
      
      // Teachers
      prisma.user.upsert({
        where: { email: 'john.doe@ckcm.edu' },
        update: {},
        create: {
          users_id: 'TCH001',
          email: 'john.doe@ckcm.edu',
          password: hashedPassword,
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          isEmailVerified: true,
          isActive: true,
          department_id: departments[0].department_id,
          role_id: roles[0].role_id,
          status_id: statuses[0].status_id
        }
      }),
      prisma.user.upsert({
        where: { email: 'jane.smith@ckcm.edu' },
        update: {},
        create: {
          users_id: 'TCH002',
          email: 'jane.smith@ckcm.edu',
          password: hashedPassword,
          name: 'Jane Smith',
          firstName: 'Jane',
          lastName: 'Smith',
          isEmailVerified: true,
          isActive: true,
          department_id: departments[1].department_id,
          role_id: roles[0].role_id,
          status_id: statuses[0].status_id
        }
      }),
      prisma.user.upsert({
        where: { email: 'robert.wilson@ckcm.edu' },
        update: {},
        create: {
          users_id: 'TCH003',
          email: 'robert.wilson@ckcm.edu',
          password: hashedPassword,
          name: 'Robert Wilson',
          firstName: 'Robert',
          lastName: 'Wilson',
          isEmailVerified: true,
          isActive: true,
          department_id: departments[2].department_id,
          role_id: roles[0].role_id,
          status_id: statuses[1].status_id
        }
      }),
      
      // Department Heads
      prisma.user.upsert({
        where: { email: 'cs.head@ckcm.edu' },
        update: {},
        create: {
          users_id: 'DHD001',
          email: 'cs.head@ckcm.edu',
          password: hashedPassword,
          name: 'Dr. Alice Brown',
          firstName: 'Alice',
          lastName: 'Brown',
          isEmailVerified: true,
          isActive: true,
          isDepartmentHead: true,
          department_id: departments[0].department_id,
          role_id: roles[1].role_id,
          status_id: statuses[0].status_id
        }
      }),
      prisma.user.upsert({
        where: { email: 'math.head@ckcm.edu' },
        update: {},
        create: {
          users_id: 'DHD002',
          email: 'math.head@ckcm.edu',
          password: hashedPassword,
          name: 'Dr. David Lee',
          firstName: 'David',
          lastName: 'Lee',
          isEmailVerified: true,
          isActive: true,
          isDepartmentHead: true,
          department_id: departments[1].department_id,
          role_id: roles[1].role_id,
          status_id: statuses[0].status_id
        }
      }),
      
      // Non-teaching Staff
      prisma.user.upsert({
        where: { email: 'admin.staff@ckcm.edu' },
        update: {},
        create: {
          users_id: 'ADM001',
          email: 'admin.staff@ckcm.edu',
          password: hashedPassword,
          name: 'Lisa Garcia',
          firstName: 'Lisa',
          lastName: 'Garcia',
          isEmailVerified: true,
          isActive: true,
          department_id: departments[4].department_id,
          role_id: roles[3].role_id,
          status_id: statuses[0].status_id
        }
      })
    ])

    // 9. Create Leave Applications
    console.log('📝 Creating leave applications...')
    const leaveApplications = []
    
    // Generate applications for the past 6 months
    const months = 6
    const applicationsPerMonth = 8
    
    for (let month = 0; month < months; month++) {
      const baseDate = new Date()
      baseDate.setMonth(baseDate.getMonth() - month)
      
      for (let i = 0; i < applicationsPerMonth; i++) {
        const user = users[Math.floor(Math.random() * users.length)]
        const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)]
        const statuses = ['PENDING', 'DEAN_APPROVED', 'APPROVED', 'DENIED']
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        
        const startDate = new Date(baseDate)
        startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 15))
        
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1)
        
        const appliedAt = new Date(startDate)
        appliedAt.setDate(appliedAt.getDate() - Math.floor(Math.random() * 10) - 1)
        
        const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        
        const application = await prisma.leaveApplication.create({
          data: {
            users_id: user.users_id,
            calendar_period_id: calendarPeriods[0].calendar_period_id,
            startDate,
            endDate,
            reason: `Test leave application ${i + 1} for ${user.name}`,
            status: status as any,
            appliedAt,
            numberOfDays,
            hours: numberOfDays * 8,
            specificPurpose: `Purpose for leave application ${i + 1}`,
            leave_type_id: leaveType.leave_type_id,
            reviewedAt: status === 'APPROVED' || status === 'DENIED' ? new Date(appliedAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000) : null,
            reviewedBy: status === 'APPROVED' || status === 'DENIED' ? users[Math.floor(Math.random() * users.length)].users_id : null,
            comments: status === 'DENIED' ? 'Application denied due to insufficient documentation' : null
          }
        })
        
        leaveApplications.push(application)
      }
    }

    // 10. Create Travel Orders
    console.log('✈️ Creating travel orders...')
    const travelOrders = []
    
    // Generate travel orders for the past 4 months
    for (let month = 0; month < 4; month++) {
      const baseDate = new Date()
      baseDate.setMonth(baseDate.getMonth() - month)
      
      for (let i = 0; i < 3; i++) {
        const user = users[Math.floor(Math.random() * users.length)]
        const statuses = ['PENDING', 'DEAN_APPROVED', 'APPROVED', 'DENIED']
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        
        const dateOfTravel = new Date(baseDate)
        dateOfTravel.setDate(dateOfTravel.getDate() + Math.floor(Math.random() * 15))
        
        const expectedReturn = new Date(dateOfTravel)
        expectedReturn.setDate(expectedReturn.getDate() + Math.floor(Math.random() * 5) + 1)
        
        const appliedAt = new Date(dateOfTravel)
        appliedAt.setDate(appliedAt.getDate() - Math.floor(Math.random() * 10) - 1)
        
        const destinations = [
          'Manila, Philippines',
          'Cebu, Philippines', 
          'Davao, Philippines',
          'Singapore',
          'Hong Kong',
          'Tokyo, Japan',
          'Seoul, South Korea'
        ]
        
        const purposes = [
          'Academic Conference',
          'Research Collaboration',
          'Training Workshop',
          'Seminar Attendance',
          'Professional Development',
          'International Conference'
        ]
        
        const transportationFee = Math.floor(Math.random() * 5000) + 1000
        const seminarConferenceFee = Math.floor(Math.random() * 10000) + 2000
        const mealsAccommodations = Math.floor(Math.random() * 8000) + 1500
        const totalCashRequested = transportationFee + seminarConferenceFee + mealsAccommodations
        
        const travelOrder = await prisma.travelOrder.create({
          data: {
            users_id: user.users_id,
            calendar_period_id: calendarPeriods[0].calendar_period_id,
            destination: destinations[Math.floor(Math.random() * destinations.length)],
            purpose: purposes[Math.floor(Math.random() * purposes.length)],
            dateOfTravel,
            expectedReturn,
            transportationFee,
            seminarConferenceFee,
            mealsAccommodations,
            totalCashRequested,
            supportingDocuments: `travel_docs_${user.users_id}_${i}.pdf`,
            remarks: `Travel order ${i + 1} for ${user.name}`,
            status: status as any,
            appliedAt,
            reviewedAt: status === 'APPROVED' || status === 'DENIED' ? new Date(appliedAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000) : null,
            reviewedBy: status === 'APPROVED' || status === 'DENIED' ? users[Math.floor(Math.random() * users.length)].users_id : null,
            comments: status === 'DENIED' ? 'Travel order denied due to budget constraints' : null
          }
        })
        
        travelOrders.push(travelOrder)
      }
    }

    // 11. Create Leave Balances
    console.log('⚖️ Creating leave balances...')
    for (const user of users) {
      for (const leaveType of leaveTypes) {
        const allowedDays = Math.floor(Math.random() * 15) + 5
        const usedDays = Math.floor(Math.random() * 8)
        await prisma.leaveBalance.upsert({
          where: {
            users_id_calendar_period_id_term_type_id_leave_type_id: {
              users_id: user.users_id,
              calendar_period_id: calendarPeriods[0].calendar_period_id,
              term_type_id: termTypes[0].term_type_id,
              leave_type_id: leaveType.leave_type_id
            }
          },
          update: {
            allowedDays,
            usedDays,
            remainingDays: Math.max(0, allowedDays - usedDays),
            lastCalculated: new Date()
          },
          create: {
            users_id: user.users_id,
            calendar_period_id: calendarPeriods[0].calendar_period_id,
            status_id: user.status_id!,
            leave_type_id: leaveType.leave_type_id,
            term_type_id: termTypes[0].term_type_id,
            allowedDays,
            usedDays,
            remainingDays: Math.max(0, allowedDays - usedDays),
            lastCalculated: new Date()
          }
        })
      }
    }

    // 12. Create Leave Limits
    console.log('📊 Creating leave limits...')
    for (const status of statuses) {
      for (const leaveType of leaveTypes) {
        for (const termType of termTypes) {
          await prisma.leaveLimit.upsert({
            where: {
              status_id_term_type_id_leave_type_id: {
                status_id: status.status_id,
                term_type_id: termType.term_type_id,
                leave_type_id: leaveType.leave_type_id
              }
            },
            update: {
              daysAllowed: Math.floor(Math.random() * 20) + 10,
              isActive: true
            },
            create: {
              status_id: status.status_id,
              leave_type_id: leaveType.leave_type_id,
              term_type_id: termType.term_type_id,
              daysAllowed: Math.floor(Math.random() * 20) + 10,
              isActive: true
            }
          })
        }
      }
    }

    console.log('✅ Finance Report Test Data Seeding Completed!')
    console.log(`📊 Created:`)
    console.log(`   - ${departments.length} departments`)
    console.log(`   - ${roleCategories.length} role categories`)
    console.log(`   - ${roles.length} roles`)
    console.log(`   - ${statuses.length} statuses`)
    console.log(`   - ${termTypes.length} term types`)
    console.log(`   - ${calendarPeriods.length} calendar periods`)
    console.log(`   - ${leaveTypes.length} leave types`)
    console.log(`   - ${users.length} users`)
    console.log(`   - ${leaveApplications.length} leave applications`)
    console.log(`   - ${travelOrders.length} travel orders`)
    console.log(`   - Multiple leave balances and limits`)
    
    console.log('\n🎯 Test Data Summary:')
    console.log('   - Finance users: finance.officer@ckcm.edu, finance.head@ckcm.edu')
    console.log('   - Teachers: john.doe@ckcm.edu, jane.smith@ckcm.edu, robert.wilson@ckcm.edu')
    console.log('   - Department Heads: cs.head@ckcm.edu, math.head@ckcm.edu')
    console.log('   - All passwords: password123')
    console.log('   - Data spans 6 months with realistic patterns')
    console.log('   - Mix of approved, pending, and denied applications')
    console.log('   - Travel orders with realistic costs and destinations')

  } catch (error) {
    console.error('❌ Error seeding finance test data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
