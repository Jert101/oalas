import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
	console.log('Seeding database with initial data...')

	// Roles (normalized names to match app usage)
	const roleNames = [
		'Admin',
		'Teacher/Instructor',
		'Non Teaching Personnel',
		'Dean/Program Head',
		'Finance Department',
		'HR Department',
		'Registrar',
	]

	for (const name of roleNames) {
		await prisma.role.upsert({ where: { name }, update: {}, create: { name } })
	}

	const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } })
	const teacherRole = await prisma.role.findUnique({ where: { name: 'Teacher/Instructor' } })
	const financeRole = await prisma.role.findUnique({ where: { name: 'Finance Department' } })
	if (!adminRole || !teacherRole || !financeRole) throw new Error('Required roles not found after upsert')

	// Statuses
	const statusNames = ['Regular', 'Probation', 'Contract', 'Part Time']
	for (const name of statusNames) {
		await prisma.status.upsert({ where: { name }, update: {}, create: { name } })
	}
	const regularStatus = await prisma.status.findUnique({ where: { name: 'Regular' } })
	if (!regularStatus) throw new Error('Regular status not found')

	// Minimal department for references
	const csDept = await prisma.department.upsert({
		where: { name: 'Bachelor of Science in Computer Science' },
		update: {},
		create: { name: 'Bachelor of Science in Computer Science', category: 'ACADEMIC_DEPARTMENT' },
	})

	// Users
	const adminUser = await prisma.user.upsert({
		where: { email: 'admin@admin.com' },
		update: {},
		create: {
			users_id: '24010001',
			email: 'admin@admin.com',
			password: await bcrypt.hash('password', 12),
			name: 'System Administrator',
			firstName: 'System',
			lastName: 'Administrator',
			profilePicture: '/ckcm.png',
			role_id: adminRole.role_id,
			status_id: regularStatus.status_id,
			isEmailVerified: true,
			isActive: true,
		},
	})

	const teacherUser = await prisma.user.upsert({
		where: { email: 'teacher@oalass.com' },
		update: {},
		create: {
			users_id: '24010002',
			email: 'teacher@oalass.com',
			password: await bcrypt.hash('teacher123', 12),
			name: 'John Doe',
			firstName: 'John',
			lastName: 'Doe',
			profilePicture: '/ckcm.png',
			role_id: teacherRole.role_id,
			department_id: csDept.department_id,
			status_id: regularStatus.status_id,
			isEmailVerified: true,
			isActive: true,
		},
	})

	const financeUser = await prisma.user.upsert({
		where: { email: 'finance@oalass.com' },
		update: {},
		create: {
			users_id: '24010003',
			email: 'finance@oalass.com',
			password: await bcrypt.hash('finance123', 12),
			name: 'Jane Smith',
			firstName: 'Jane',
			lastName: 'Smith',
			profilePicture: '/ckcm.png',
			role_id: financeRole.role_id,
			status_id: regularStatus.status_id,
			isEmailVerified: true,
			isActive: true,
		},
	})

	console.log('Seed complete:')
	console.log(`Admin: ${adminUser.email} / password`)
	console.log(`Teacher: ${teacherUser.email} / teacher123`)
	console.log(`Finance: ${financeUser.email} / finance123`)
}

main()
	.catch((e) => {
		console.error('Seeding failed:', e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
