const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function restoreAllData() {
  try {
    console.log('🔄 Starting database restoration...\n');

    // 1. Create Roles
    console.log('📋 Creating roles...');
    const roles = await Promise.all([
      prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
          name: 'Admin',
          description: 'System Administrator'
        }
      }),
      prisma.role.upsert({
        where: { name: 'Teacher/Instructor' },
        update: {},
        create: {
          name: 'Teacher/Instructor',
          description: 'Teaching staff'
        }
      }),
      prisma.role.upsert({
        where: { name: 'Dean/Program Head' },
        update: {},
        create: {
          name: 'Dean/Program Head',
          description: 'Department head or dean'
        }
      }),
      prisma.role.upsert({
        where: { name: 'Non Teaching Personnel' },
        update: {},
        create: {
          name: 'Non Teaching Personnel',
          description: 'Non-teaching staff'
        }
      })
    ]);
    console.log('✅ Roles created successfully');

    // 2. Create Departments
    console.log('\n🏢 Creating departments...');
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
        where: { name: 'Information Technology' },
        update: {},
        create: {
          name: 'Information Technology',
          description: 'Information Technology Department',
          category: 'ACADEMIC_DEPARTMENT'
        }
      }),
      prisma.department.upsert({
        where: { name: 'Business Administration' },
        update: {},
        create: {
          name: 'Business Administration',
          description: 'Business Administration Department',
          category: 'ACADEMIC_DEPARTMENT'
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
      }),
      prisma.department.upsert({
        where: { name: 'Accounting' },
        update: {},
        create: {
          name: 'Accounting',
          description: 'Accounting Department',
          category: 'NON_TEACHING_PERSONNEL'
        }
      })
    ]);
    console.log('✅ Departments created successfully');

    // 3. Create Statuses
    console.log('\n👥 Creating statuses...');
    const statuses = await Promise.all([
      prisma.status.upsert({
        where: { name: 'Regular' },
        update: {},
        create: {
          name: 'Regular',
          description: 'Regular employee'
        }
      }),
      prisma.status.upsert({
        where: { name: 'Probation' },
        update: {},
        create: {
          name: 'Probation',
          description: 'Probationary employee'
        }
      })
    ]);
    console.log('✅ Statuses created successfully');

    // 4. Create Term Types
    console.log('\n📅 Creating term types...');
    const termTypes = await Promise.all([
      prisma.termType.upsert({
        where: { name: 'First Semester' },
        update: {},
        create: {
          name: 'First Semester',
          description: 'First semester of the academic year'
        }
      }),
      prisma.termType.upsert({
        where: { name: 'Second Semester' },
        update: {},
        create: {
          name: 'Second Semester',
          description: 'Second semester of the academic year'
        }
      }),
      prisma.termType.upsert({
        where: { name: 'Summer' },
        update: {},
        create: {
          name: 'Summer',
          description: 'Summer term'
        }
      })
    ]);
    console.log('✅ Term types created successfully');

    // 5. Create Leave Types
    console.log('\n🏖️ Creating leave types...');
    const leaveTypes = await Promise.all([
      prisma.leave_types.upsert({
        where: { name: 'Vacation Leave' },
        update: {},
        create: {
          name: 'Vacation Leave',
          description: 'Annual vacation leave'
        }
      }),
      prisma.leave_types.upsert({
        where: { name: 'Sick Leave' },
        update: {},
        create: {
          name: 'Sick Leave',
          description: 'Medical leave for illness'
        }
      }),
      prisma.leave_types.upsert({
        where: { name: 'Maternity Leave' },
        update: {},
        create: {
          name: 'Maternity Leave',
          description: 'Leave for expecting mothers'
        }
      }),
      prisma.leave_types.upsert({
        where: { name: 'Paternity Leave' },
        update: {},
        create: {
          name: 'Paternity Leave',
          description: 'Leave for new fathers'
        }
      }),
      prisma.leave_types.upsert({
        where: { name: 'Emergency Leave' },
        update: {},
        create: {
          name: 'Emergency Leave',
          description: 'Emergency or urgent leave'
        }
      }),
      prisma.leave_types.upsert({
        where: { name: 'Travel Order' },
        update: {},
        create: {
          name: 'Travel Order',
          description: 'Official travel orders'
        }
      })
    ]);
    console.log('✅ Leave types created successfully');

    // 6. Create Calendar Periods
    console.log('\n📆 Creating calendar periods...');
    const currentDate = new Date();
    const calendarPeriods = await Promise.all([
      prisma.calendarPeriod.upsert({
        where: { 
          academicYear: '2024-2025',
          term_type_id: termTypes[0].term_type_id // First Semester
        },
        update: {},
        create: {
          academicYear: '2024-2025',
          startDate: new Date('2024-08-01'),
          endDate: new Date('2024-12-15'),
          isCurrent: true,
          isActive: true,
          term_type_id: termTypes[0].term_type_id
        }
      }),
      prisma.calendarPeriod.upsert({
        where: { 
          academicYear: '2024-2025',
          term_type_id: termTypes[1].term_type_id // Second Semester
        },
        update: {},
        create: {
          academicYear: '2024-2025',
          startDate: new Date('2025-01-15'),
          endDate: new Date('2025-05-30'),
          isCurrent: false,
          isActive: true,
          term_type_id: termTypes[1].term_type_id
        }
      })
    ]);
    console.log('✅ Calendar periods created successfully');

    // 7. Create Leave Limits
    console.log('\n📊 Creating leave limits...');
    const leaveLimits = [];
    
    // Regular status limits
    for (const leaveType of leaveTypes.slice(0, 5)) { // Exclude Travel Order
      for (const termType of termTypes) {
        const daysAllowed = leaveType.name === 'Maternity Leave' ? 105 : 
                           leaveType.name === 'Paternity Leave' ? 7 :
                           leaveType.name === 'Emergency Leave' ? 5 : 15;
        
        leaveLimits.push(
          prisma.leaveLimit.upsert({
            where: {
              status_id_term_type_id_leave_type_id: {
                status_id: statuses[0].status_id, // Regular
                term_type_id: termType.term_type_id,
                leave_type_id: leaveType.leave_type_id
              }
            },
            update: {},
            create: {
              status_id: statuses[0].status_id,
              term_type_id: termType.term_type_id,
              leave_type_id: leaveType.leave_type_id,
              daysAllowed: daysAllowed,
              isActive: true
            }
          })
        );
      }
    }

    // Probation status limits (reduced days)
    for (const leaveType of leaveTypes.slice(0, 5)) { // Exclude Travel Order
      for (const termType of termTypes) {
        const daysAllowed = leaveType.name === 'Maternity Leave' ? 105 : 
                           leaveType.name === 'Paternity Leave' ? 7 :
                           leaveType.name === 'Emergency Leave' ? 3 : 10;
        
        leaveLimits.push(
          prisma.leaveLimit.upsert({
            where: {
              status_id_term_type_id_leave_type_id: {
                status_id: statuses[1].status_id, // Probation
                term_type_id: termType.term_type_id,
                leave_type_id: leaveType.leave_type_id
              }
            },
            update: {},
            create: {
              status_id: statuses[1].status_id,
              term_type_id: termType.term_type_id,
              leave_type_id: leaveType.leave_type_id,
              daysAllowed: daysAllowed,
              isActive: true
            }
          })
        );
      }
    }

    await Promise.all(leaveLimits);
    console.log('✅ Leave limits created successfully');

    // 8. Create Sample Users
    console.log('\n👤 Creating sample users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await Promise.all([
      // Admin user
      prisma.user.upsert({
        where: { email: 'admin@ckcm.edu.ph' },
        update: {},
        create: {
          users_id: 'admin-001',
          email: 'admin@ckcm.edu.ph',
          password: hashedPassword,
          name: 'System Administrator',
          firstName: 'System',
          lastName: 'Administrator',
          isDepartmentHead: true,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          isActive: true,
          role_id: roles[0].role_id, // Admin
          department_id: departments[0].department_id, // Computer Science
          status_id: statuses[0].status_id // Regular
        }
      }),
      // Teacher user
      prisma.user.upsert({
        where: { email: 'teacher@ckcm.edu.ph' },
        update: {},
        create: {
          users_id: 'teacher-001',
          email: 'teacher@ckcm.edu.ph',
          password: hashedPassword,
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          isDepartmentHead: false,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          isActive: true,
          role_id: roles[1].role_id, // Teacher
          department_id: departments[0].department_id, // Computer Science
          status_id: statuses[0].status_id // Regular
        }
      }),
      // Probationary teacher
      prisma.user.upsert({
        where: { email: 'probation@ckcm.edu.ph' },
        update: {},
        create: {
          users_id: 'probation-001',
          email: 'probation@ckcm.edu.ph',
          password: hashedPassword,
          name: 'Jane Smith',
          firstName: 'Jane',
          lastName: 'Smith',
          isDepartmentHead: false,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          isActive: true,
          role_id: roles[1].role_id, // Teacher
          department_id: departments[1].department_id, // IT
          status_id: statuses[1].status_id // Probation
        }
      }),
      // Dean user
      prisma.user.upsert({
        where: { email: 'dean@ckcm.edu.ph' },
        update: {},
        create: {
          users_id: 'dean-001',
          email: 'dean@ckcm.edu.ph',
          password: hashedPassword,
          name: 'Dr. Maria Garcia',
          firstName: 'Maria',
          lastName: 'Garcia',
          isDepartmentHead: true,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          isActive: true,
          role_id: roles[2].role_id, // Dean
          department_id: departments[2].department_id, // Business Admin
          status_id: statuses[0].status_id // Regular
        }
      })
    ]);
    console.log('✅ Sample users created successfully');

    // 9. Create Leave Balances for current period
    console.log('\n💰 Creating leave balances...');
    const currentPeriod = calendarPeriods[0]; // First semester 2024-2025
    const leaveBalances = [];

    for (const user of users) {
      for (const leaveType of leaveTypes.slice(0, 5)) { // Exclude Travel Order
        const leaveLimit = await prisma.leaveLimit.findFirst({
          where: {
            status_id: user.status_id,
            term_type_id: currentPeriod.term_type_id,
            leave_type_id: leaveType.leave_type_id
          }
        });

        if (leaveLimit) {
          leaveBalances.push(
            prisma.leaveBalance.upsert({
              where: {
                users_id_calendar_period_id_term_type_id_leave_type_id: {
                  users_id: user.users_id,
                  calendar_period_id: currentPeriod.calendar_period_id,
                  term_type_id: currentPeriod.term_type_id,
                  leave_type_id: leaveType.leave_type_id
                }
              },
              update: {},
              create: {
                users_id: user.users_id,
                calendar_period_id: currentPeriod.calendar_period_id,
                status_id: user.status_id,
                term_type_id: currentPeriod.term_type_id,
                leave_type_id: leaveType.leave_type_id,
                allowedDays: leaveLimit.daysAllowed,
                usedDays: 0,
                remainingDays: leaveLimit.daysAllowed
              }
            })
          );
        }
      }
    }

    await Promise.all(leaveBalances);
    console.log('✅ Leave balances created successfully');

    // 10. Create Sample Leave Applications
    console.log('\n📝 Creating sample leave applications...');
    const sampleApplications = await Promise.all([
      prisma.leaveApplication.create({
        data: {
          users_id: users[1].users_id, // Teacher
          calendar_period_id: currentPeriod.calendar_period_id,
          leave_type_id: leaveTypes[0].leave_type_id, // Vacation Leave
          startDate: new Date('2024-09-15'),
          endDate: new Date('2024-09-17'),
          reason: 'Family vacation',
          status: 'APPROVED',
          appliedAt: new Date('2024-09-01'),
          reviewedAt: new Date('2024-09-02'),
          reviewedBy: users[0].users_id, // Admin
          comments: 'Approved for family vacation',
          paymentStatus: 'PAID',
          numberOfDays: 3,
          hours: 24,
          specificPurpose: 'Family vacation to the beach'
        }
      }),
      prisma.leaveApplication.create({
        data: {
          users_id: users[2].users_id, // Probationary teacher
          calendar_period_id: currentPeriod.calendar_period_id,
          leave_type_id: leaveTypes[1].leave_type_id, // Sick Leave
          startDate: new Date('2024-10-20'),
          endDate: new Date('2024-10-22'),
          reason: 'Fever and flu',
          status: 'PENDING',
          appliedAt: new Date('2024-10-19'),
          paymentStatus: 'PAID',
          numberOfDays: 3,
          hours: 24,
          descriptionOfSickness: 'High fever and severe flu symptoms'
        }
      })
    ]);
    console.log('✅ Sample leave applications created successfully');

    // 11. Create Sample Travel Orders
    console.log('\n✈️ Creating sample travel orders...');
    const sampleTravelOrders = await Promise.all([
      prisma.travelOrder.create({
        data: {
          users_id: users[1].users_id, // Teacher
          calendar_period_id: currentPeriod.calendar_period_id,
          destination: 'Manila',
          purpose: 'Educational Conference',
          dateOfTravel: new Date('2024-11-15'),
          expectedReturn: new Date('2024-11-17'),
          transportationFee: 2500.00,
          seminarConferenceFee: 5000.00,
          mealsAccommodations: 3000.00,
          totalCashRequested: 10500.00,
          remarks: 'Attending ICT Conference 2024',
          status: 'APPROVED',
          appliedAt: new Date('2024-11-01'),
          reviewedAt: new Date('2024-11-02'),
          reviewedBy: users[0].users_id // Admin
        }
      })
    ]);
    console.log('✅ Sample travel orders created successfully');

    console.log('\n🎉 Database restoration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • ${roles.length} roles created`);
    console.log(`   • ${departments.length} departments created`);
    console.log(`   • ${statuses.length} statuses created`);
    console.log(`   • ${termTypes.length} term types created`);
    console.log(`   • ${leaveTypes.length} leave types created`);
    console.log(`   • ${calendarPeriods.length} calendar periods created`);
    console.log(`   • ${leaveLimits.length} leave limits created`);
    console.log(`   • ${users.length} users created`);
    console.log(`   • ${leaveBalances.length} leave balances created`);
    console.log(`   • ${sampleApplications.length} sample leave applications created`);
    console.log(`   • ${sampleTravelOrders.length} sample travel orders created`);

    console.log('\n🔑 Default login credentials:');
    console.log('   • Admin: admin@ckcm.edu.ph / password123');
    console.log('   • Teacher: teacher@ckcm.edu.ph / password123');
    console.log('   • Probationary: probation@ckcm.edu.ph / password123');
    console.log('   • Dean: dean@ckcm.edu.ph / password123');

  } catch (error) {
    console.error('❌ Error during database restoration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAllData();
