import nodemailer from 'nodemailer'

// Create reusable transporter
export const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Email templates
export const emailTemplates = {
  leaveApplicationSubmitted: (userName: string, applicationId: number, leaveType: string) => ({
    subject: 'Leave Application Submitted - CKCM OALAS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CKCM OALAS</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Online Academic Leave Application System</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Leave Application Submitted Successfully</h2>
          
            <p>Dear <strong>${userName}</strong>,</p>
            
          <p>Your <strong>${leaveType}</strong> leave application has been submitted successfully and is now pending approval.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #28a745;">Application Details</h3>
            <p><strong>Application ID:</strong> #${applicationId}</p>
            <p><strong>Status:</strong> Pending Review</p>
            <p><strong>Leave Type:</strong> ${leaveType}</p>
            </div>
            
          <p>You will receive email notifications when your application status changes. You can also check your application status by logging into your OALAS account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Application Status
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px;">
            <strong>Important:</strong> Please keep this email for your records. If you have any questions about your application, please contact your department head or the administration office.
          </p>
          
          <p style="color: #666; font-size: 14px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2025 CKCM Technologies, LLC. All rights reserved.</p>
        </div>
    </div>
    `
  }),

  leaveApplicationApproved: (userName: string, applicationId: number, leaveType: string, approverName: string) => ({
    subject: 'Leave Application Approved - CKCM OALAS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CKCM OALAS</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Online Academic Leave Application System</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">🎉 Leave Application Approved!</h2>
          
          <p>Dear <strong>${userName}</strong>,</p>
          
          <p>Great news! Your <strong>${leaveType}</strong> leave application has been approved.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #28a745;">Application Details</h3>
            <p><strong>Application ID:</strong> #${applicationId}</p>
            <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">APPROVED</span></p>
            <p><strong>Leave Type:</strong> ${leaveType}</p>
            <p><strong>Approved by:</strong> ${approverName}</p>
          </div>
          
          <p>Your leave application is now approved and you can proceed with your planned leave. Please ensure you follow all leave policies and procedures.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" 
               style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Application Details
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px;">
            <strong>Note:</strong> Please keep this email for your records. If you need to make any changes to your approved leave, please contact your department head immediately.
          </p>
          
          <p style="color: #666; font-size: 14px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2025 CKCM Technologies, LLC. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  leaveApplicationRejected: (userName: string, applicationId: number, leaveType: string, rejectionReason: string, approverName: string) => ({
    subject: 'Leave Application Update - CKCM OALAS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CKCM OALAS</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Online Academic Leave Application System</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Leave Application Update</h2>
          
            <p>Dear <strong>${userName}</strong>,</p>
            
          <p>We regret to inform you that your <strong>${leaveType}</strong> leave application could not be approved at this time.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="margin-top: 0; color: #dc3545;">Application Details</h3>
            <p><strong>Application ID:</strong> #${applicationId}</p>
            <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">NOT APPROVED</span></p>
            <p><strong>Leave Type:</strong> ${leaveType}</p>
            <p><strong>Reviewed by:</strong> ${approverName}</p>
            <p><strong>Reason:</strong> ${rejectionReason}</p>
            </div>
            
          <p>If you have questions about this decision or would like to discuss alternative arrangements, please contact your department head or the administration office.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" 
               style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Application Details
            </a>
            </div>
            
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px;">
            <strong>Note:</strong> You may submit a new leave application after addressing the concerns mentioned above.
          </p>
          
          <p style="color: #666; font-size: 14px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2025 CKCM Technologies, LLC. All rights reserved.</p>
        </div>
    </div>
    `
  }),

  newApplicationForReviewer: (reviewerName: string, applicantName: string, applicationId: number, leaveType: string) => ({
    subject: 'New Leave Application Requires Review - CKCM OALAS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CKCM OALAS</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Online Academic Leave Application System</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">New Leave Application Requires Review</h2>
          
          <p>Dear <strong>${reviewerName}</strong>,</p>
          
          <p><strong>${applicantName}</strong> has submitted a new <strong>${leaveType}</strong> leave application that requires your review.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #667eea;">Application Details</h3>
            <p><strong>Application ID:</strong> #${applicationId}</p>
            <p><strong>Applicant:</strong> ${applicantName}</p>
            <p><strong>Leave Type:</strong> ${leaveType}</p>
            <p><strong>Status:</strong> Pending Review</p>
            </div>
            
          <p>Please log into your OALAS account to review the application details and take appropriate action.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review Application
            </a>
            </div>
            
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px;">
            <strong>Note:</strong> Please review this application promptly to ensure timely processing for the applicant.
          </p>
          
          <p style="color: #666; font-size: 14px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2025 CKCM Technologies, LLC. All rights reserved.</p>
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

// Verify email configuration
export async function verifyEmailConfig() {
  try {
    await transporter.verify()
    console.log('✅ Email configuration verified successfully')
    return true
  } catch (error) {
    console.error('❌ Email configuration verification failed:', error)
    return false
  }
}