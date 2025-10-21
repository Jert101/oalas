import { prisma } from "@/lib/prisma"

export const FINAL_APPLICATION_STATUSES = [
	"APPROVED",
	"DENIED",
	"DEAN_REJECTED",
	"CANCELLED",
	"DEAN_APPROVED",
] as const

export type FinalStatus = typeof FINAL_APPLICATION_STATUSES[number]

export async function getDeanDepartmentIdByEmail(email: string) {
	const dean = await prisma.user.findUnique({
		where: { email },
		select: { users_id: true, department_id: true },
	})
	return dean
}

export async function listCalendarPeriods() {
	return prisma.calendarPeriod.findMany({
		include: { termType: true },
		orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
	})
}

export async function listArchivedApplicationsForDepartment(
	departmentId: number,
	calendarPeriodId: number,
) {
	return prisma.leaveApplication.findMany({
		where: {
			status: { in: FINAL_APPLICATION_STATUSES as unknown as any },
			calendar_period_id: calendarPeriodId,
			user: { department_id: departmentId },
		},
		include: { leaveType: true, calendarPeriod: { include: { termType: true } } },
		orderBy: { appliedAt: "desc" },
	})
}

export async function listArchivedTravelOrdersForDepartment(
	departmentId: number,
	calendarPeriodId: number,
) {
	return prisma.travelOrder.findMany({
		where: {
			status: { in: FINAL_APPLICATION_STATUSES as unknown as any },
			calendar_period_id: calendarPeriodId,
			user: { department_id: departmentId },
		},
		include: { calendarPeriod: { include: { termType: true } } },
		orderBy: { appliedAt: "desc" },
	})
}

export async function listArchivedApplicationsForUser(
	usersId: string,
	calendarPeriodId: number,
) {
	return prisma.leaveApplication.findMany({
		where: {
			status: { in: FINAL_APPLICATION_STATUSES as unknown as any },
			calendar_period_id: calendarPeriodId,
			users_id: usersId,
		},
		include: { leaveType: true, calendarPeriod: { include: { termType: true } } },
		orderBy: { appliedAt: "desc" },
	})
}

export async function listArchivedTravelOrdersForUser(
	usersId: string,
	calendarPeriodId: number,
) {
	return prisma.travelOrder.findMany({
		where: {
			status: { in: FINAL_APPLICATION_STATUSES as unknown as any },
			calendar_period_id: calendarPeriodId,
			users_id: usersId,
		},
		include: { calendarPeriod: { include: { termType: true } } },
		orderBy: { appliedAt: "desc" },
	})
}


