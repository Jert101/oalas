"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Printer, ArrowLeft, FileText } from "lucide-react"

interface CurrentPeriod {
	calendar_period_id: number
	academicYear: string
	startDate: string
	endDate: string
	termType: { name: string }
}

interface CurrentApplication {
	id: number
	type: 'leave' | 'travel'
	leaveType: string
	startDate: string
	endDate: string
	status: "PENDING" | "APPROVED" | "DENIED" | "CANCELLED" | "DEAN_APPROVED" | "DEAN_REJECTED"
	appliedAt: string
	reason?: string
	numberOfDays?: number
	specificPurpose?: string
	descriptionOfSickness?: string
	medicalProof?: string
	academicYear?: string
	termType?: string
	user: {
		name: string
		email: string
		department?: { name: string } | null
	}
	reviewerDean?: string | null
	reviewerFinance?: string | null
	supervisorStatus: "PENDING" | "APPROVED" | "REJECTED"
	approvingOfficerStatus: "PENDING" | "APPROVED" | "REJECTED"
	// Dean review information
	deanReviewedAt?: string
	deanReviewedBy?: string
	deanComments?: string
	deanRejectionReason?: string
	// Travel order specific fields
	destination?: string
	transportationFee?: number
	seminarConferenceFee?: number
	mealsAccommodations?: number
	totalCashRequested?: number
	remarks?: string
	supportingDocuments?: string
	attachments?: {
		fileName: string
		fileUrl: string
		fileType: string
	}[]
}

export default function DeanCurrentApplicationPage() {
	const router = useRouter()
	const { data: session } = useSession()
	const [period, setPeriod] = useState<CurrentPeriod | null>(null)
	const [application, setApplication] = useState<CurrentApplication | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			try {
				const [periodRes, appRes, userRes] = await Promise.all([
					fetch("/api/calendar-period/current"),
					fetch("/api/dean/leave/current"),
					fetch("/api/user/profile")
				])

				if (!periodRes.ok) throw new Error("Failed to load current period")
				const periodData = await periodRes.json()
				setPeriod(periodData)

				if (!appRes.ok) throw new Error("Failed to load applications")
				const appJson = await appRes.json()
				const app = appJson.application || null

				// Get user data including department
				let userData = null
				if (userRes.ok) {
					const userJson = await userRes.json()
					userData = userJson.user
				}

				if (app) {
					setApplication({
						id: app.id,
						type: app.type || 'leave',
						leaveType: app.leaveType,
						// For travel orders, use the specific travel date fields
						startDate: app.type === 'travel' ? app.dateOfTravel : app.startDate,
						endDate: app.type === 'travel' ? app.expectedReturn : app.endDate,
						status: app.status,
						appliedAt: app.appliedAt ? new Date(app.appliedAt).toISOString() : new Date().toISOString(),
						reason: app.reason,
						// Only calculate numberOfDays for leave applications
						numberOfDays: app.type === 'leave' ? (
							typeof app.numberOfDays === 'number' ? app.numberOfDays : 0
						) : undefined,
						specificPurpose: app.specificPurpose || (app.type === 'travel' ? app.purpose : undefined),
						descriptionOfSickness: app.descriptionOfSickness,
						medicalProof: app.medicalProof,
						academicYear: app.academicYear,
						termType: app.termType,
						user: {
							name: userData?.name || session?.user?.name || "",
							email: userData?.email || session?.user?.email || "",
							department: userData?.department || null
						},
						reviewerDean: app.deanReviewedBy || app.reviewedBy || null,
						reviewerFinance: null,
						supervisorStatus: (app.status === "DEAN_APPROVED" ? "APPROVED" : app.status === "DEAN_REJECTED" ? "REJECTED" : "PENDING"),
						approvingOfficerStatus: (app.status === "APPROVED" ? "APPROVED" : app.status === "DENIED" ? "REJECTED" : "PENDING"),
						// Dean review information
						deanReviewedAt: app.deanReviewedAt,
						deanReviewedBy: app.deanReviewedBy,
						deanComments: app.deanComments,
						deanRejectionReason: app.deanRejectionReason,
						// Travel order specific fields
						destination: app.destination,
						transportationFee: app.transportationFee,
						seminarConferenceFee: app.seminarConferenceFee,
						mealsAccommodations: app.mealsAccommodations,
						totalCashRequested: app.totalCashRequested,
						remarks: app.remarks,
						supportingDocuments: app.supportingDocuments,
						attachments: app.supportingDocuments?.map((doc: { fileName: string; fileUrl: string; fileType: string }) => ({
							fileName: doc.fileName,
							fileUrl: doc.fileUrl,
							fileType: doc.fileType
						}))
					})
				} else {
					setApplication(null)
				}
			} catch (e) {
				console.error(e)
				toast.error("Failed to load current application")
			} finally {
				setIsLoading(false)
			}
		}
		load()
	}, [session?.user?.email, session?.user?.name])

	const handlePrint = () => {
		window.print()
	}

	const statusBadge = useMemo(() => {
		switch (application?.status) {
			case "APPROVED":
				return (
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 bg-green-500 rounded-full"></div>
						<Badge className="bg-green-50 text-green-700 border-green-200 font-medium">✓ Approved</Badge>
					</div>
				)
			case "DEAN_APPROVED":
				return (
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
						<Badge className="bg-blue-50 text-blue-700 border-blue-200 font-medium">✓ Dean Approved</Badge>
					</div>
				)
			case "DEAN_REJECTED":
				return (
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 bg-red-500 rounded-full"></div>
						<Badge className="bg-red-50 text-red-700 border-red-200 font-medium">✗ Dean Rejected</Badge>
					</div>
				)
			case "DENIED":
				return (
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 bg-red-500 rounded-full"></div>
						<Badge className="bg-red-50 text-red-700 border-red-200 font-medium">✗ Rejected</Badge>
					</div>
				)
			case "CANCELLED":
				return (
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 bg-gray-500 rounded-full"></div>
						<Badge className="bg-gray-50 text-gray-700 border-gray-200 font-medium">⊘ Cancelled</Badge>
					</div>
				)
			default:
				return (
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
						<Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 font-medium">⏳ Pending</Badge>
					</div>
				)
		}
	}, [application?.status])

	const formatDate = (d: string) => {
		try {
			const date = new Date(d)
			if (isNaN(date.getTime())) return "-"
			return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
		} catch {
			return "-"
		}
	}

	// Helper functions to determine which fields to show based on leave type
	const shouldShowSpecificPurpose = (leaveType: string) => {
		const purposeTypes = ['Vacation Leave', 'Paternity Leave', 'Maternity Leave']
		return purposeTypes.includes(leaveType)
	}

	const shouldShowDescriptionOfSickness = (leaveType: string) => {
		const sicknessTypes = ['Emergency Leave', 'Sick Leave']
		return sicknessTypes.includes(leaveType)
	}

	const shouldShowReason = (leaveType: string) => {
		return !shouldShowSpecificPurpose(leaveType) && !shouldShowDescriptionOfSickness(leaveType)
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Page Actions (hidden in print) */}
			<div className="flex items-center justify-between print:hidden">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Current Application</h1>
					<p className="text-muted-foreground">{period?.academicYear} • {period?.termType?.name}</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => router.push('/dean/dashboard')}>
						<ArrowLeft className="mr-2 h-4 w-4" />Back
					</Button>
					<Button onClick={handlePrint}>
						<Printer className="mr-2 h-4 w-4" />Print
					</Button>
				</div>
			</div>

			{!application ? (
				<Card>
					<CardContent className="py-12 text-center text-gray-600">
						<FileText className="mx-auto h-10 w-10 text-gray-400" />
						No application found in current period.
					</CardContent>
				</Card>
			) : (
				<div className="mx-auto w-full max-w-[720px] print:max-w-none">
					{/* Preview Frame for on-screen only */}
					<div className="print:hidden rounded-lg border bg-white shadow-sm p-4">
						<p className="text-sm text-muted-foreground">Print Preview • Half Short (5.5 x 8.5 inches)</p>
					</div>

					{/* Fixed-size print sheet wrapper */}
					<div className="mt-3 print-sheet">
					<Card className="print:shadow-none print:border-0 h-full">
						<CardHeader className="border-b print:border-none pb-4">
							<div className="flex items-center gap-3 justify-center">
								<Image src="/ckcm.png" alt="CKCM" width={40} height={40} />
								<div className="text-center">
									<CardTitle className="text-lg font-bold tracking-wide uppercase">Christ the King College De Maranding</CardTitle>
									<CardDescription className="text-sm text-black">Maranding Lala Lanao del Norte</CardDescription>
									<div className="mt-1 font-semibold text-black">
										{application.type === 'travel' ? 'Travel Order Application' : 'Application for Leave of Absence'}
									</div>
								</div>
							</div>
							<div className="mt-3 flex items-center justify-between text-xs text-gray-600">
								<div>Academic Year: <span className="font-medium text-gray-900">{application.academicYear}</span></div>
								<div>Term: <span className="font-medium text-gray-900">{application.termType}</span></div>
							</div>
						</CardHeader>
						<CardContent className="p-6 print:p-4">
							{/* Header Information */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-5">
								<div className="space-y-1">
									<div className="text-[11px] text-gray-500">Employee Name</div>
									<div className="font-medium">{application.user.name}</div>
								</div>
								<div className="space-y-1">
									<div className="text-[11px] text-gray-500">Department</div>
									<div className="font-medium">{application.user.department?.name || "N/A"}</div>
								</div>
								<div className="space-y-1">
									<div className="text-[11px] text-gray-500">Applied On</div>
									<div className="font-medium">{formatDate(application.appliedAt)}</div>
								</div>
								<div className="space-y-1">
									<div className="text-[11px] text-gray-500">Application Status</div>
									<div>{statusBadge}</div>
								</div>
							</div>

							{/* Application Type Specific Details */}
							{application.type === 'travel' ? (
								<>
									{/* Travel Order Details */}
									<div className="space-y-6">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
											<div className="space-y-1">
												<div className="text-[11px] font-medium text-gray-700">TRAVEL DETAILS</div>
												<div className="rounded-md border bg-gray-50 p-3">
													<div className="grid gap-2">
														<div>
															<div className="text-[11px] text-gray-600">Destination</div>
															<div className="font-medium">{application.destination || "-"}</div>
														</div>
														<div>
															<div className="text-[11px] text-gray-600">Purpose</div>
															<div className="font-medium">{application.specificPurpose || application.reason || "-"}</div>
														</div>
													</div>
												</div>
											</div>
											<div className="space-y-1">
												<div className="text-[11px] font-medium text-gray-700">SCHEDULE</div>
												<div className="rounded-md border bg-gray-50 p-3">
													<div className="grid gap-2">
														<div>
															<div className="text-[11px] text-gray-600">Date of Travel</div>
															<div className="font-medium">
																{formatDate(application.startDate)}
															</div>
														</div>
														<div>
															<div className="text-[11px] text-gray-600">Expected Return</div>
															<div className="font-medium">
																{formatDate(application.endDate)}
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</>
							) : (
								<>
									{/* Leave Application Details */}
									<div className="space-y-6">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
											<div className="space-y-1">
												<div className="text-[11px] font-medium text-gray-700">LEAVE DETAILS</div>
												<div className="rounded-md border bg-gray-50 p-3">
													<div className="grid gap-2">
														<div>
															<div className="text-[11px] text-gray-600">Type of Leave</div>
															<div className="font-medium">{application.leaveType}</div>
														</div>
														{shouldShowDescriptionOfSickness(application.leaveType) && application.descriptionOfSickness && (
															<div>
																<div className="text-[11px] text-gray-600">Description of Sickness</div>
																<div className="font-medium">{application.descriptionOfSickness}</div>
															</div>
														)}
														{shouldShowSpecificPurpose(application.leaveType) && application.specificPurpose && (
															<div>
																<div className="text-[11px] text-gray-600">Specific Purpose</div>
																<div className="font-medium">{application.specificPurpose}</div>
															</div>
														)}
													</div>
												</div>
											</div>
											<div className="space-y-1">
												<div className="text-[11px] font-medium text-gray-700">SCHEDULE</div>
												<div className="rounded-md border bg-gray-50 p-3">
													<div className="grid gap-2">
														<div>
															<div className="text-[11px] text-gray-600">Start Date</div>
															<div className="font-medium">{formatDate(application.startDate)}</div>
														</div>
														<div>
															<div className="text-[11px] text-gray-600">End Date</div>
															<div className="font-medium">{formatDate(application.endDate)}</div>
														</div>
														<div>
															<div className="text-[11px] text-gray-600">Duration</div>
															<div className="font-medium">{application.numberOfDays} day(s)</div>
														</div>
													</div>
												</div>
											</div>
										</div>

										{/* Leave Reason/Purpose/Sickness - Show appropriate field based on leave type */}
										{shouldShowReason(application.leaveType) && (
											<div className="text-sm">
												<div className="text-[11px] font-medium text-gray-700 mb-2">REASON FOR LEAVE</div>
												<div className="rounded-md border bg-gray-50 p-3 leading-relaxed">
													{application.reason || "-"}
												</div>
											</div>
										)}
										
										{shouldShowSpecificPurpose(application.leaveType) && application.specificPurpose && (
											<div className="text-sm">
												<div className="text-[11px] font-medium text-gray-700 mb-2">SPECIFIC PURPOSE</div>
												<div className="rounded-md border bg-gray-50 p-3 leading-relaxed">
													{application.specificPurpose}
												</div>
											</div>
										)}
										
										{shouldShowDescriptionOfSickness(application.leaveType) && application.descriptionOfSickness && (
											<div className="text-sm">
												<div className="text-[11px] font-medium text-gray-700 mb-2">DESCRIPTION OF SICKNESS</div>
												<div className="rounded-md border bg-gray-50 p-3 leading-relaxed">
													{application.descriptionOfSickness}
												</div>
											</div>
										)}

										{/* Medical Proof for Leave Applications */}
										{application.type === 'leave' && application.medicalProof && (
											<div className="text-sm">
												<div className="text-[11px] font-medium text-gray-700 mb-3">MEDICAL PROOF</div>
												<div className="rounded-md border bg-gray-50 p-3">
													<div className="flex items-center justify-between">
														<div className="flex items-center space-x-2">
															<FileText className="h-4 w-4 text-blue-600" />
															<span className="text-blue-900">
																{application.medicalProof.endsWith('.pdf') ? 'PDF Document' : 'Medical Certificate'}
															</span>
														</div>
														<a 
															href={application.medicalProof}
															target="_blank"
															rel="noopener noreferrer"
															className="text-blue-600 hover:underline text-sm font-medium"
														>
															View Document
														</a>
													</div>
													{!application.medicalProof.endsWith('.pdf') && (
														<div className="mt-3">
															<img 
																src={application.medicalProof} 
																alt="Medical Proof" 
																className="max-w-full max-h-32 object-contain rounded border"
																onError={(e) => {
																	const target = e.target as HTMLImageElement
																	target.style.display = 'none'
																}}
															/>
														</div>
													)}
												</div>
											</div>
										)}
									</div>
								</>
							)}

							{/* Travel Order Details */}
							{application.type === 'travel' && (
								<>
									<Separator className="my-5" />
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
										<div className="space-y-1">
											<div className="text-[11px] text-gray-500">Destination</div>
											<div className="font-medium">{application.destination || "-"}</div>
										</div>
										<div className="space-y-1">
											<div className="text-[11px] text-gray-500">Date of Travel</div>
											<div className="font-medium">{formatDate(application.startDate)}</div>
										</div>
										<div className="space-y-1">
											<div className="text-[11px] text-gray-500">Expected Return</div>
											<div className="font-medium">{formatDate(application.endDate)}</div>
										</div>
										<div className="space-y-1">
											<div className="text-[11px] text-gray-500">Number of Days</div>
											<div className="font-medium">{application.numberOfDays} day(s)</div>
										</div>
									</div>

									<Separator className="my-5" />
									<div className="text-sm">
										<div className="text-[11px] font-medium text-gray-700 mb-3">EXPENSES BREAKDOWN</div>
										<div className="space-y-3 rounded-md border bg-gray-50 p-4">
											<div className="flex items-center justify-between">
												<div className="text-[11px] text-gray-600">Transportation Fee</div>
												<div className="font-medium">₱ {application.transportationFee?.toLocaleString() || "0.00"}</div>
											</div>
											<div className="flex items-center justify-between">
												<div className="text-[11px] text-gray-600">Seminar/Conference Fee</div>
												<div className="font-medium">₱ {application.seminarConferenceFee?.toLocaleString() || "0.00"}</div>
											</div>
											<div className="flex items-center justify-between">
												<div className="text-[11px] text-gray-600">Meals & Accommodations</div>
												<div className="font-medium">₱ {application.mealsAccommodations?.toLocaleString() || "0.00"}</div>
											</div>
											<Separator className="my-2" />
											<div className="flex items-center justify-between">
												<div className="text-[11px] font-medium text-gray-700">TOTAL CASH REQUESTED</div>
												<div className="font-bold text-base">₱ {application.totalCashRequested?.toLocaleString() || "0.00"}</div>
											</div>
										</div>
									</div>

									<Separator className="my-5" />
									<div className="text-sm">
										<div className="text-[11px] font-medium text-gray-700 mb-3">SUPPORTING DOCUMENTS</div>
										{application.attachments && application.attachments.length > 0 ? (
											<div className="space-y-2">
												{application.attachments.map((doc, index) => (
													<div key={index} className="flex items-center justify-between rounded-md bg-blue-50 border-blue-100 border p-3">
														<div className="flex items-center space-x-2">
															<FileText className="h-4 w-4 text-blue-600" />
															<span className="text-blue-900">{doc.fileName}</span>
														</div>
														<a 
															href={doc.fileUrl}
															target="_blank"
															rel="noopener noreferrer"
															className="text-blue-600 hover:underline text-sm font-medium"
														>
															View Document
														</a>
													</div>
												))}
											</div>
										) : (
											<div className="text-center py-6 bg-gray-50 border rounded-md text-gray-500">
												<FileText className="h-5 w-5 mx-auto mb-2 text-gray-400" />
												No supporting documents attached
											</div>
										)}
									</div>

									{application.remarks && (
										<>
											<Separator className="my-5" />
											<div className="text-sm">
												<div className="text-[11px] font-medium text-gray-700 mb-3">ADDITIONAL REMARKS</div>
												<div className="rounded-md border bg-gray-50 p-3 leading-relaxed italic text-gray-700">
													{application.remarks}
												</div>
											</div>
										</>
									)}
								</>
							)}

							{/* Approval Panels */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
								<div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
									<div className="mb-3 font-semibold text-blue-900 flex items-center gap-2">
										<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
										Supervisor (Dean) Status
									</div>
									<div className="space-y-2">
										<div className="text-sm">
											<span className="text-gray-600">Status:</span> 
											<span className={`font-medium ml-1 ${
												application.supervisorStatus === "APPROVED" ? "text-green-700" :
												application.supervisorStatus === "REJECTED" ? "text-red-700" : "text-yellow-700"
											}`}>
												{application.supervisorStatus}
											</span>
										</div>
										<div className="text-sm">
											<span className="text-gray-600">Reviewed by:</span> 
											<span className="font-medium ml-1">{application.reviewerDean || "-"}</span>
										</div>
										{application.supervisorStatus === "REJECTED" && (
											<div className="text-sm mt-2 p-2 bg-red-100 border border-red-200 rounded text-red-700">
												<span className="font-medium">Reason:</span> {application.deanRejectionReason || "No reason provided"}
											</div>
										)}
									</div>
								</div>
								<div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
									<div className="mb-3 font-semibold text-green-900 flex items-center gap-2">
										<div className="w-2 h-2 bg-green-500 rounded-full"></div>
										Approving Officer Status
									</div>
									<div className="space-y-2">
										<div className="text-sm">
											<span className="text-gray-600">Status:</span> 
											<span className={`font-medium ml-1 ${
												application.approvingOfficerStatus === "APPROVED" ? "text-green-700" :
												application.approvingOfficerStatus === "REJECTED" ? "text-red-700" : "text-yellow-700"
											}`}>
												{application.approvingOfficerStatus}
											</span>
										</div>
										<div className="text-sm">
											<span className="text-gray-600">Approved by:</span> 
											<span className="font-medium ml-1">{application.reviewerFinance || "-"}</span>
										</div>
									</div>
								</div>
							</div>

							{/* Signature Lines */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
								<div className="text-center">
									<div className="h-8"></div>
									<div className="border-t w-full mx-auto" />
									<div className="text-xs mt-1 text-gray-600">Employee Signature</div>
								</div>
								<div className="text-center">
									<div className="h-8"></div>
									<div className="border-t w-full mx-auto" />
									<div className="text-xs mt-1 text-gray-600">Date</div>
								</div>
							</div>

							<div className="mt-4 text-[10px] text-gray-500">Printed on {new Date().toLocaleString()}</div>
						</CardContent>
					</Card>
					</div>
				</div>
			)}

			{/* Print styles */}
			<style jsx global>{`
				@media print {
					/* Half Short: 5.5 x 8.5 inches */
					@page { size: 5.5in 8.5in; margin: 0; }
					body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
					.print-sheet { width: 5.5in; height: 8.5in; padding: 0.35in; overflow: hidden; }
					.print-sheet * { line-height: 1.15; }
					/* Hide non-print controls */
					button, .print\\:hidden { display: none !important; }
					.card, .shadow, .shadow-sm, .shadow-md { box-shadow: none !important; }
				}
			`}</style>
		</div>
	)
}
