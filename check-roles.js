const { PrismaClient } = require('@prisma/client')

async function checkRoles() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Checking role names...')
    
    const roles = await prisma.role.findMany({
      select: {
        role_id: true,
        name: true
      }
    })
    
    console.log('Available roles:')
    roles.forEach(role => {
      console.log(`  ID: ${role.role_id}, Name: "${role.name}"`)
    })
    
    // Check admin user's role
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' },
      include: { role: true }
    })
    
    if (adminUser) {
      console.log(`\nAdmin user role: "${adminUser.role?.name}"`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRoles()
