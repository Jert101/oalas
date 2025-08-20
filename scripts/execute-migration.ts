import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function executeMigration() {
  console.log('Starting user ID migration...')
  
  try {
    // Disable foreign key checks temporarily
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`
    
    // Execute migration commands
    await prisma.$executeRaw`UPDATE users SET users_id = '2508001' WHERE users_id = 'cmdzxir500000xky8phnq6kzl';`
    console.log('✓ Updated admin@admin.com')
    
    await prisma.$executeRaw`UPDATE users SET users_id = '2508002' WHERE users_id = 'cmdzxirci0001xky8eg7zlt0s';`
    console.log('✓ Updated teacher@oalass.com')
    
    await prisma.$executeRaw`UPDATE users SET users_id = '2508003' WHERE users_id = 'cmdzxirjk0002xky8bi7w9rus';`
    console.log('✓ Updated finance@oalass.com')
    
    await prisma.$executeRaw`UPDATE users SET users_id = '2508004' WHERE users_id = 'cmdzxltl40000xkjsyym6q929';`
    console.log('✓ Updated jersoncatadman@ckcm.edu.ph')
    
    await prisma.$executeRaw`UPDATE users SET users_id = '2508005' WHERE users_id = 'cmdzzn9sg0001xk0kfo5uhnpr';`
    console.log('✓ Updated jersoncatadman88@gmail.com')
    
    await prisma.$executeRaw`UPDATE users SET users_id = '2508006' WHERE users_id = 'cme008bu70005xk0kmz3op5p0';`
    console.log('✓ Updated denise@gmail.com')
    
    await prisma.$executeRaw`UPDATE users SET users_id = '2508007' WHERE users_id = 'cme00u9an0001xkfsjj42yihk';`
    console.log('✓ Updated cherlie@gmail.com')
    
    // Re-enable foreign key checks
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`
    
    console.log('Migration completed successfully!')
    
    // Verify the migration
    const users = await prisma.users.findMany({
      select: {
        users_id: true,
        email: true,
        name: true
      }
    })
    
    console.log('\nUpdated users:')
    users.forEach(user => {
      console.log(`${user.email} - ID: ${user.users_id}`)
    })
    
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

executeMigration()
