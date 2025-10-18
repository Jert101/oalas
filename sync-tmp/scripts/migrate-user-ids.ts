import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateUsersToCustomIds() {
  try {
    console.log('Starting user ID migration...')
    
    // Get all existing users
    const existingUsers = await prisma.user.findMany({
      select: {
        users_id: true,
        email: true,
        name: true,
        role: {
          select: {
            name: true
          }
        }
      }
    })
    
    console.log(`Found ${existingUsers.length} users to migrate`)
    
    // Generate new IDs
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const prefix = `${year}${month}`
    
    // Start with 001 for first user
    let counter = 1
    
    for (const user of existingUsers) {
      const newUserId = `${prefix}${counter.toString().padStart(3, '0')}`
      
      try {
        // This will require manual database updates since we're changing primary keys
        console.log(`User: ${user.email} (${user.name}) - Role: ${user.role?.name}`)
        console.log(`  Old ID: ${user.users_id}`)
        console.log(`  New ID: ${newUserId}`)
        console.log(`  SQL: UPDATE users SET users_id = '${newUserId}' WHERE users_id = '${user.users_id}';`)
        
        counter++
      } catch (error) {
        console.error(`Error updating user ${user.email}:`, error)
      }
    }
    
    console.log('\nMigration plan generated. Please run the SQL commands manually.')
    console.log('Note: You may need to disable foreign key checks temporarily.')
    
  } catch (error) {
    console.error('Migration error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateUsersToCustomIds()
