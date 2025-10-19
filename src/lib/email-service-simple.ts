import nodemailer from 'nodemailer'

// Create reusable transporter
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Simple email templates
export const emailTemplates = {
  leaveApplicationSubmitted: (userName: string, applicationId: number, leaveType: string) => ({
    subject: 'Leave Application Submitted - CKCM OALAS',
    html: `<h1>Leave Application Submitted</h1><p>Dear ${userName}, your ${leaveType} application #${applicationId} has been submitted.</p>`
  }),
  
  leaveApplicationApproved: (userName: string, applicationId: number, leaveType: string, approverName: string) => ({
    subject: 'Leave Application Approved - CKCM OALAS',
    html: `<h1>Leave Application Approved</h1><p>Dear ${userName}, your ${leaveType} application #${applicationId} has been approved by ${approverName}.</p>`
  }),
  
  leaveApplicationRejected: (userName: string, applicationId: number, leaveType: string, rejectionReason: string, approverName: string) => ({
    subject: 'Leave Application Update - CKCM OALAS',
    html: `<h1>Leave Application Update</h1><p>Dear ${userName}, your ${leaveType} application #${applicationId} was not approved. Reason: ${rejectionReason}</p>`
  }),
  
  newApplicationForReviewer: (reviewerName: string, applicantName: string, applicationId: number, leaveType: string) => ({
    subject: 'New Leave Application Requires Review - CKCM OALAS',
    html: `<h1>New Application for Review</h1><p>Dear ${reviewerName}, ${applicantName} has submitted a new ${leaveType} application #${applicationId}.</p>`
  })
}

// Send email function
export async function sendEmail(to: string, subject: string, htmlContent: string) {
  try {
    console.log('📧 Sending email to:', to)
    
    const mailOptions = {
      from: `"CKCM OALAS" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully:', result.messageId)
    
    return {
      success: true,
      messageId: result.messageId
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
