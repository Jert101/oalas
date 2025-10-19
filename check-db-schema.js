const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema for leave_applications table...');
    
    // Check if the medicalProof column exists and its type
    const result = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'oalass' 
      AND TABLE_NAME = 'leave_applications' 
      AND COLUMN_NAME = 'medicalProof'
    `;
    
    console.log('MedicalProof column info:', result);
    
    // Also check the entire table structure
    const tableStructure = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'oalass' 
      AND TABLE_NAME = 'leave_applications'
      ORDER BY ORDINAL_POSITION
    `;
    
    console.log('Full leave_applications table structure:');
    console.table(tableStructure);
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
