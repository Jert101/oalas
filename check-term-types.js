const { PrismaClient } = require('@prisma/client')

async function checkTermTypes() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Checking term types...')
    
    const termTypes = await prisma.termType.findMany({
      select: {
        term_type_id: true,
        name: true
      }
    })
    
    console.log('Available term types:')
    termTypes.forEach(term => {
      console.log(`  ID: ${term.term_type_id}, Name: "${term.name}"`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTermTypes()
