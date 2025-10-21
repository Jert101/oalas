import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import {
	getDeanDepartmentIdByEmail,
	listCalendarPeriods,
	listArchivedApplicationsForUser,
	listArchivedTravelOrdersForUser,
} from "@/lib/archive"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function DeanPersonalArchivePage() {
	const session = await getServerSession(authOptions)
	if (!session) redirect("/login")
	const role = (session.user as any)?.role
	if (role !== "Dean/Program Head" && role !== "Department Head" && role !== "Admin") {
		redirect("/dashboard")
	}

	const dean = await getDeanDepartmentIdByEmail(session.user.email!)
	if (!dean?.users_id) {
		return (
			<div className="p-6">
				<Card>
					<CardHeader>
						<CardTitle>Personal Archive</CardTitle>
					</CardHeader>
					<CardContent>
						<p>Dean record not found.</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	const periods = await listCalendarPeriods()

	return (
		<div className="p-6 space-y-6">
			<h1 className="text-2xl font-semibold">Personal Archive</h1>
			{periods.map(async (p) => {
				const [apps, travels] = await Promise.all([
					listArchivedApplicationsForUser(dean.users_id!, p.calendar_period_id),
					listArchivedTravelOrdersForUser(dean.users_id!, p.calendar_period_id),
				])
				const total = apps.length + travels.length
				if (total === 0) return null
				return (
					<Card key={p.calendar_period_id} className="overflow-hidden">
						<CardHeader className="flex items-center justify-between">
							<CardTitle className="text-lg">
								{p.academicYear} • {p.termType?.name}
							</CardTitle>
							<Badge variant="secondary">{total} archived</Badge>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{apps.map((a) => (
									<div key={`leave_${a.leave_application_id}`} className="flex items-center justify-between border rounded-md p-3">
										<div className="flex flex-col">
											<span className="font-medium">{a.leaveType?.name}</span>
											<span className="text-sm text-muted-foreground">{new Date(a.appliedAt).toLocaleDateString()} — {a.status}</span>
										</div>
										<Badge>{"Leave"}</Badge>
									</div>
								))}
								{travels.map((t) => (
									<div key={`travel_${t.travel_order_id}`} className="flex items-center justify-between border rounded-md p-3">
										<div className="flex flex-col">
											<span className="font-medium">Travel Order — {t.destination}</span>
											<span className="text-sm text-muted-foreground">{new Date(t.appliedAt).toLocaleDateString()} — {t.status}</span>
										</div>
										<Badge>Travel</Badge>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)
			})}
		</div>
	)
}


