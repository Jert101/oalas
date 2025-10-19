/**
 * Utility function to format user role display
 * For office head users, displays as "Department Name (Office Head)"
 * For other users, displays the role name as is
 */

export function formatRoleDisplay(
  role: string | undefined,
  department: string | undefined,
  isDepartmentHead: boolean | undefined
): string {
  // If user is a department head and has a department, show "Department Name (Office Head)"
  if (isDepartmentHead && department) {
    return `${department} (Office Head)`
  }
  
  // Otherwise, just return the role name
  return role || "No Role"
}

/**
 * Get the display role for a user session
 */
export function getUserDisplayRole(session: any): string {
  const role = session?.user?.role
  const department = session?.user?.department
  const isDepartmentHead = session?.user?.isDepartmentHead
  
  return formatRoleDisplay(role, department, isDepartmentHead)
}
