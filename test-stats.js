// Test calculateStats function
const sampleUsers = [
  {
    users_id: 1,
    name: "Admin User",
    role: { name: "Admin" },
    status: { name: "Regular" }
  },
  {
    users_id: 2,
    name: "Teacher User",
    role: { name: "Teacher/Instructor" },
    status: { name: "Probation" }
  },
  {
    users_id: 3,
    name: "Finance User",
    role: { name: "Finance Department" },
    status: { name: "Regular" }
  }
];

function calculateStats(usersData) {
  console.log('calculateStats called with:', usersData?.length, 'users')
  console.log('Sample user data:', usersData?.[0])
  
  const stats = usersData.reduce((acc, user) => {
    acc.total++
    
    // Role counts
    switch (user.role?.name) {
      case "Admin":
        acc.admin++
        break
      case "Teacher/Instructor":
        acc.teacher++
        break
      case "Non Teaching Personnel":
        acc.nonTeaching++
        break
      case "Dean/Program Head":
        acc.dean++
        break
      case "Finance Department":
        acc.finance++
        break
    }
    
    // Status counts
    switch (user.status?.name) {
      case "Probation":
        acc.probationary++
        break
      case "Regular":
        acc.regular++
        break
    }
    
    return acc
  }, {
    total: 0,
    admin: 0,
    teacher: 0,
    nonTeaching: 0,
    dean: 0,
    finance: 0,
    probationary: 0,
    regular: 0
  })
  
  console.log('Calculated stats:', stats)
  return stats
}

// Test the function
console.log('Testing calculateStats function:')
const result = calculateStats(sampleUsers)
console.log('Final result:', result)
