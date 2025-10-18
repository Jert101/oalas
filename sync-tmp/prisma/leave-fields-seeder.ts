import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createLeaveFieldsSeeder() {
  try {
    console.log('🔄 Starting Leave Type Form Fields Seeder...')
    
    // Get all existing leave types
    const leaveTypes = await prisma.leave_types.findMany({
      orderBy: { name: 'asc' }
    })
    
    console.log(`📋 Found ${leaveTypes.length} leave types to configure`)
    
    // Define default field configurations based on common leave types
    const fieldConfigurations = {
      // Vacation/Personal Leave fields
      vacation: [
        {
          fieldName: "specificPurpose",
          fieldLabel: "Specific Purpose",
          fieldType: "textarea",
          isRequired: true,
          placeholder: "Please describe the specific purpose for this vacation leave",
          helpText: "Provide detailed information about the reason for your vacation",
          displayOrder: 0
        },
        {
          fieldName: "destination",
          fieldLabel: "Destination (Optional)",
          fieldType: "text",
          isRequired: false,
          placeholder: "Where will you be during your leave?",
          helpText: "Optional: Specify your location during the leave period",
          displayOrder: 1
        },
        {
          fieldName: "emergencyContact",
          fieldLabel: "Emergency Contact",
          fieldType: "text",
          isRequired: false,
          placeholder: "Contact person and number in case of emergency",
          helpText: "Person to contact in case of urgent work matters",
          displayOrder: 2
        }
      ],
      
      // Sick Leave fields
      sick: [
        {
          fieldName: "descriptionOfSickness",
          fieldLabel: "Description of Illness/Condition",
          fieldType: "textarea",
          isRequired: true,
          placeholder: "Please describe your illness or medical condition",
          helpText: "Provide details about your medical condition requiring leave",
          displayOrder: 0
        },
        {
          fieldName: "medicalProof",
          fieldLabel: "Medical Certificate",
          fieldType: "file",
          isRequired: false,
          placeholder: "Upload medical certificate or doctor's note",
          helpText: "Medical documentation supporting your leave request",
          displayOrder: 1
        },
        {
          fieldName: "expectedRecoveryDate",
          fieldLabel: "Expected Recovery Date",
          fieldType: "date",
          isRequired: false,
          placeholder: "When do you expect to return to work?",
          helpText: "Estimated date when you'll be fit to return to work",
          displayOrder: 2
        }
      ],
      
      // Emergency Leave fields
      emergency: [
        {
          fieldName: "natureOfEmergency",
          fieldLabel: "Nature of Emergency",
          fieldType: "textarea",
          isRequired: true,
          placeholder: "Please describe the emergency situation",
          helpText: "Provide details about the emergency requiring immediate leave",
          displayOrder: 0
        },
        {
          fieldName: "supportingDocuments",
          fieldLabel: "Supporting Documents",
          fieldType: "file",
          isRequired: false,
          placeholder: "Upload relevant documents if available",
          helpText: "Any documentation supporting the emergency (police report, hospital records, etc.)",
          displayOrder: 1
        },
        {
          fieldName: "immediateContactInfo",
          fieldLabel: "Immediate Contact Information",
          fieldType: "text",
          isRequired: true,
          placeholder: "How can we reach you during this emergency?",
          helpText: "Phone number or contact method during the emergency period",
          displayOrder: 2
        }
      ],
      
      // Maternity Leave fields
      maternity: [
        {
          fieldName: "expectedDeliveryDate",
          fieldLabel: "Expected Delivery Date",
          fieldType: "date",
          isRequired: true,
          placeholder: "Expected date of delivery",
          helpText: "The estimated due date as per medical records",
          displayOrder: 0
        },
        {
          fieldName: "medicalCertificate",
          fieldLabel: "Medical Certificate",
          fieldType: "file",
          isRequired: true,
          placeholder: "Upload medical certificate from your doctor",
          helpText: "Medical documentation confirming pregnancy and expected delivery date",
          displayOrder: 1
        },
        {
          fieldName: "preferredReturnDate",
          fieldLabel: "Preferred Return Date",
          fieldType: "date",
          isRequired: false,
          placeholder: "When would you prefer to return to work?",
          helpText: "Your preferred return date (subject to policy limits)",
          displayOrder: 2
        }
      ],
      
      // Paternity Leave fields
      paternity: [
        {
          fieldName: "childBirthDate",
          fieldLabel: "Child's Birth Date",
          fieldType: "date",
          isRequired: true,
          placeholder: "Date of child's birth",
          helpText: "The actual or expected birth date of your child",
          displayOrder: 0
        },
        {
          fieldName: "birthCertificate",
          fieldLabel: "Birth Certificate",
          fieldType: "file",
          isRequired: false,
          placeholder: "Upload birth certificate or hospital record",
          helpText: "Official documentation of the child's birth",
          displayOrder: 1
        },
        {
          fieldName: "relationshipToChild",
          fieldLabel: "Relationship to Child",
          fieldType: "select",
          isRequired: true,
          options: JSON.stringify(["Father", "Adoptive Father", "Legal Guardian"]),
          helpText: "Your relationship to the child",
          displayOrder: 2
        }
      ],
      
      // Bereavement Leave fields
      bereavement: [
        {
          fieldName: "relationshipToDeceased",
          fieldLabel: "Relationship to Deceased",
          fieldType: "text",
          isRequired: true,
          placeholder: "Your relationship to the deceased person",
          helpText: "Specify your relationship (spouse, parent, child, sibling, etc.)",
          displayOrder: 0
        },
        {
          fieldName: "dateOfDeath",
          fieldLabel: "Date of Death",
          fieldType: "date",
          isRequired: true,
          placeholder: "Date when the person passed away",
          helpText: "The date of death as per official records",
          displayOrder: 1
        },
        {
          fieldName: "funeralDetails",
          fieldLabel: "Funeral/Service Details",
          fieldType: "textarea",
          isRequired: false,
          placeholder: "Details about funeral service, location, and dates",
          helpText: "Information about funeral arrangements requiring your attendance",
          displayOrder: 2
        },
        {
          fieldName: "deathCertificate",
          fieldLabel: "Death Certificate",
          fieldType: "file",
          isRequired: false,
          placeholder: "Upload death certificate if available",
          helpText: "Official documentation of the death",
          displayOrder: 3
        }
      ],
      
      // Study/Training Leave fields
      study: [
        {
          fieldName: "courseDetails",
          fieldLabel: "Course/Training Details",
          fieldType: "textarea",
          isRequired: true,
          placeholder: "Details about the course, training, or educational program",
          helpText: "Provide comprehensive information about the educational activity",
          displayOrder: 0
        },
        {
          fieldName: "institution",
          fieldLabel: "Institution/Training Provider",
          fieldType: "text",
          isRequired: true,
          placeholder: "Name of the educational institution or training provider",
          helpText: "The organization providing the education or training",
          displayOrder: 1
        },
        {
          fieldName: "relevanceToWork",
          fieldLabel: "Relevance to Current Role",
          fieldType: "textarea",
          isRequired: true,
          placeholder: "How does this training relate to your current position?",
          helpText: "Explain how this education/training will benefit your work performance",
          displayOrder: 2
        },
        {
          fieldName: "enrollmentProof",
          fieldLabel: "Enrollment Documentation",
          fieldType: "file",
          isRequired: false,
          placeholder: "Upload enrollment letter or course confirmation",
          helpText: "Official documentation of your enrollment in the program",
          displayOrder: 3
        }
      ],
      
      // Default fields for other/unspecified leave types
      default: [
        {
          fieldName: "specificPurpose",
          fieldLabel: "Specific Purpose",
          fieldType: "textarea",
          isRequired: true,
          placeholder: "Please describe the specific purpose for this leave",
          helpText: "Provide detailed information about the reason for your leave request",
          displayOrder: 0
        },
        {
          fieldName: "additionalInformation",
          fieldLabel: "Additional Information",
          fieldType: "textarea",
          isRequired: false,
          placeholder: "Any additional relevant information",
          helpText: "Optional: Provide any other details that might be relevant to your request",
          displayOrder: 1
        },
        {
          fieldName: "supportingDocuments",
          fieldLabel: "Supporting Documents",
          fieldType: "file",
          isRequired: false,
          placeholder: "Upload any supporting documentation",
          helpText: "Optional: Attach any documents that support your leave request",
          displayOrder: 2
        }
      ]
    }
    
    // Function to determine field configuration based on leave type name
    function getFieldConfigForLeaveType(leaveTypeName: string) {
      const name = leaveTypeName.toLowerCase()
      
      if (name.includes('vacation') || name.includes('personal')) {
        return fieldConfigurations.vacation
      } else if (name.includes('sick') || name.includes('medical')) {
        return fieldConfigurations.sick
      } else if (name.includes('emergency')) {
        return fieldConfigurations.emergency
      } else if (name.includes('maternity')) {
        return fieldConfigurations.maternity
      } else if (name.includes('paternity')) {
        return fieldConfigurations.paternity
      } else if (name.includes('bereavement') || name.includes('funeral')) {
        return fieldConfigurations.bereavement
      } else if (name.includes('study') || name.includes('training') || name.includes('education')) {
        return fieldConfigurations.study
      } else {
        return fieldConfigurations.default
      }
    }
    
    let totalFieldsCreated = 0
    
    // Create form fields for each leave type
    for (const leaveType of leaveTypes) {
      console.log(`\n⚙️ Configuring fields for: ${leaveType.name}`)
      
      // Check if fields already exist for this leave type
      const existingFields = await prisma.leaveTypeFormField.findMany({
        where: { leave_type_id: leaveType.leave_type_id }
      })
      
      if (existingFields.length > 0) {
        console.log(`   ⏭️ Skipping - ${existingFields.length} fields already exist`)
        continue
      }
      
      // Get appropriate field configuration
      const fieldConfig = getFieldConfigForLeaveType(leaveType.name)
      
      // Create the fields
      const createdFields = await Promise.all(
        fieldConfig.map(async (field) => {
          const created = await prisma.leaveTypeFormField.create({
            data: {
              leave_type_id: leaveType.leave_type_id,
              fieldName: field.fieldName,
              fieldLabel: field.fieldLabel,
              fieldType: field.fieldType,
              isRequired: field.isRequired,
              placeholder: field.placeholder,
              helpText: field.helpText,
              options: field.options || null,
              displayOrder: field.displayOrder,
              isActive: true
            }
          })
          return created
        })
      )
      
      console.log(`   ✅ Created ${createdFields.length} fields`)
      totalFieldsCreated += createdFields.length
    }
    
    console.log('\n🎉 Leave Type Form Fields Seeder completed successfully!')
    console.log('\n📋 SUMMARY:')
    console.log('=' .repeat(60))
    console.log(`📊 Leave Types Processed: ${leaveTypes.length}`)
    console.log(`📝 Total Fields Created: ${totalFieldsCreated}`)
    
    if (leaveTypes.length > 0) {
      console.log('\n📋 LEAVE TYPES CONFIGURED:')
      leaveTypes.forEach(lt => {
        const fieldType = getFieldConfigForLeaveType(lt.name) === fieldConfigurations.default ? 'Default' : 
                         lt.name.toLowerCase().includes('vacation') ? 'Vacation' :
                         lt.name.toLowerCase().includes('sick') ? 'Sick' :
                         lt.name.toLowerCase().includes('emergency') ? 'Emergency' :
                         lt.name.toLowerCase().includes('maternity') ? 'Maternity' :
                         lt.name.toLowerCase().includes('paternity') ? 'Paternity' :
                         lt.name.toLowerCase().includes('bereavement') ? 'Bereavement' :
                         lt.name.toLowerCase().includes('study') ? 'Study' : 'Default'
        console.log(`   • ${lt.name} → ${fieldType} Fields`)
      })
    }
    
    console.log('\n💡 NOTES:')
    console.log('• Fields are automatically assigned based on leave type names')
    console.log('• You can customize fields through the admin interface at /admin/leave-types')
    console.log('• Each leave type now has appropriate form fields for applications')
    
    return {
      success: true,
      leaveTypesProcessed: leaveTypes.length,
      totalFieldsCreated
    }

  } catch (error) {
    console.error('❌ Error during leave fields seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Execute the seeder
if (require.main === module) {
  createLeaveFieldsSeeder()
    .then((result) => {
      console.log('\n✅ Leave fields seeding process completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Leave fields seeding failed:', error)
      process.exit(1)
    })
}

export default createLeaveFieldsSeeder





