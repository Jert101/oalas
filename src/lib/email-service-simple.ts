import nodemailer from 'nodemailer'

// Create reusable transporter
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Professional email templates
export const emailTemplates = {
  leaveApplicationSubmitted: (userName: string, applicationId: number, leaveType: string) => ({
    subject: 'Leave Application Submitted - CKCM OALAS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">CKCM OALAS</h1>
          <p style="margin: 5px 0 0 0;">Online Application for Leave of Absence</p>
        </div>
        <div style="padding: 30px; background-color: #f8fafc;">
          <h2 style="color: #1e40af;">Leave Application Submitted</h2>
          <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${userName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">Your <strong>${leaveType}</strong> application has been successfully submitted and is now pending approval.</p>
          <div style="background-color: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Application ID:</strong> #${applicationId}</p>
            <p style="margin: 5px 0 0 0;"><strong>Status:</strong> Pending Review</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6;">You will receive another notification once your application has been reviewed.</p>
          <p style="font-size: 16px; line-height: 1.6;">Thank you for using CKCM OALAS.</p>
        </div>
        <div style="background-color: #1f2937; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">Christ the King College de Maranding, Inc.</p>
          <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply.</p>
        </div>
      </div>
    `
  }),
  
  leaveApplicationApproved: (userName: string, applicationId: number, leaveType: string, approverName: string) => ({
    subject: 'Leave Application Approved - CKCM OALAS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">CKCM OALAS</h1>
          <p style="margin: 5px 0 0 0;">Online Application for Leave of Absence</p>
        </div>
        <div style="padding: 30px; background-color: #f0fdf4;">
          <h2 style="color: #047857;">✅ Leave Application Approved</h2>
          <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${userName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">Great news! Your <strong>${leaveType}</strong> application has been approved.</p>
          <div style="background-color: #dcfce7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Application ID:</strong> #${applicationId}</p>
            <p style="margin: 5px 0 0 0;"><strong>Status:</strong> Approved ✅</p>
            <p style="margin: 5px 0 0 0;"><strong>Approved by:</strong> ${approverName}</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6;">Your leave application is now ready for processing. You may proceed with your planned leave.</p>
          <p style="font-size: 16px; line-height: 1.6;">Thank you for using CKCM OALAS.</p>
        </div>
        <div style="background-color: #1f2937; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">Christ the King College de Maranding, Inc.</p>
          <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply.</p>
        </div>
      </div>
    `
  }),
  
  leaveApplicationRejected: (userName: string, applicationId: number, leaveType: string, rejectionReason: string, approverName: string) => ({
    subject: 'Leave Application Update - CKCM OALAS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">CKCM OALAS</h1>
          <p style="margin: 5px 0 0 0;">Online Application for Leave of Absence</p>
        </div>
        <div style="padding: 30px; background-color: #fef2f2;">
          <h2 style="color: #b91c1c;">❌ Leave Application Update</h2>
          <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${userName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">We regret to inform you that your <strong>${leaveType}</strong> application was not approved.</p>
          <div style="background-color: #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Application ID:</strong> #${applicationId}</p>
            <p style="margin: 5px 0 0 0;"><strong>Status:</strong> Not Approved ❌</p>
            <p style="margin: 5px 0 0 0;"><strong>Reviewed by:</strong> ${approverName}</p>
            <p style="margin: 5px 0 0 0;"><strong>Reason:</strong> ${rejectionReason}</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6;">If you have any questions about this decision, please contact the appropriate department.</p>
          <p style="font-size: 16px; line-height: 1.6;">Thank you for using CKCM OALAS.</p>
        </div>
        <div style="background-color: #1f2937; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">Christ the King College de Maranding, Inc.</p>
          <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply.</p>
        </div>
      </div>
    `
  }),
  
  newApplicationForReviewer: (reviewerName: string, applicantName: string, applicationId: number, leaveType: string) => ({
    subject: 'New Leave Application Requires Review - CKCM OALAS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #7c3aed; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">CKCM OALAS</h1>
          <p style="margin: 5px 0 0 0;">Online Application for Leave of Absence</p>
        </div>
        <div style="padding: 30px; background-color: #faf5ff;">
          <h2 style="color: #6d28d9;">🔔 New Application for Review</h2>
          <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${reviewerName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">A new leave application has been submitted and requires your review.</p>
          <div style="background-color: #e9d5ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Applicant:</strong> ${applicantName}</p>
            <p style="margin: 5px 0 0 0;"><strong>Leave Type:</strong> ${leaveType}</p>
            <p style="margin: 5px 0 0 0;"><strong>Application ID:</strong> #${applicationId}</p>
            <p style="margin: 5px 0 0 0;"><strong>Status:</strong> Pending Review</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6;">Please log in to the CKCM OALAS system to review and process this application.</p>
          <p style="font-size: 16px; line-height: 1.6;">Thank you for your attention.</p>
        </div>
        <div style="background-color: #1f2937; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">Christ the King College de Maranding, Inc.</p>
          <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply.</p>
        </div>
      </div>
    `
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
