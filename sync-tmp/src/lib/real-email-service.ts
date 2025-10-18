import { Resend } from 'resend'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export class RealEmailService {
  private static instance: RealEmailService
  private resend: Resend
  
  constructor() {
    // For demonstration, we'll use a test mode that logs emails
    // In production, you would use a real Resend API key
    this.resend = new Resend('re_demo_key') // This will be in test mode
  }
  
  static getInstance(): RealEmailService {
    if (!RealEmailService.instance) {
      RealEmailService.instance = new RealEmailService()
    }
    return RealEmailService.instance
  }

  async sendProbationCompletionEmail(
    userEmail: string,
    userName: string,
    probationEndDate: Date
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`📧 Sending real email to: ${userEmail}`)
      
      const emailContent = {
        from: 'OALASS HR Department <hr@oalass.dev>',
        to: [userEmail],
        subject: '🎉 Congratulations! Your Probation Period is Complete - OALASS',
        html: this.generateProbationCompletionHTML(userName, probationEndDate),
        text: this.generateProbationCompletionText(userName, probationEndDate)
      }

      // Since we're using a demo key, let's simulate sending with detailed logging
      console.log('\n📧 EMAIL DETAILS:')
      console.log('='.repeat(60))
      console.log(`From: ${emailContent.from}`)
      console.log(`To: ${emailContent.to[0]}`)
      console.log(`Subject: ${emailContent.subject}`)
      console.log('='.repeat(60))
      
      // For demo purposes, we'll use nodemailer with Gmail SMTP as fallback
      return await this.sendViaGmailSMTP(emailContent, userEmail, userName, probationEndDate)
      
    } catch (error) {
      console.error('❌ Failed to send probation completion email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private async sendViaGmailSMTP(
    emailContent: {
      from: string;
      to: string[];
      subject: string;
      html: string;
      text: string;
    },
    userEmail: string,
    _userName: string,
    _probationEndDate: Date
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Import nodemailer dynamically
      const nodemailer = await import('nodemailer')
      
      // Create transporter with real Gmail SMTP
      const transporter = nodemailer.default.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })

      console.log(`📧 Using Gmail SMTP: ${process.env.GMAIL_USER}`)
      
      const info = await transporter.sendMail({
        from: emailContent.from,
        to: userEmail,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      })

      console.log('✅ Email sent successfully!')
      console.log(`📧 Message ID: ${info.messageId}`)
      console.log(`� Email delivered to: ${userEmail}`)
      
      return {
        success: true,
        messageId: info.messageId
      }
      
    } catch (error) {
      console.error('❌ SMTP Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private generateProbationCompletionHTML(userName: string, probationEndDate: Date): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Probation Period Complete</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            padding: 30px;
        }
        .highlight {
            background-color: #e8f5e8;
            border-left: 4px solid #28a745;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .stats {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            text-align: center;
        }
        .stat-item {
            flex: 1;
            padding: 15px;
        }
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #28a745;
            margin-bottom: 5px;
        }
        .celebration {
            text-align: center;
            font-size: 48px;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background-color: #28a745;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 15px 0;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="celebration">🎉</div>
            <h1>Congratulations!</h1>
            <p>Your Probation Period is Complete</p>
        </div>
        
        <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            
            <p>We are <strong>delighted</strong> to inform you that your probation period has been successfully completed as of <strong>${probationEndDate.toDateString()}</strong>.</p>
            
            <div class="highlight">
                <h3>🌟 You are now a Regular Employee!</h3>
                <p>This promotion comes with all the benefits and privileges of being a permanent member of our team.</p>
            </div>
            
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-number">90</div>
                    <div>Days Completed</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">✓</div>
                    <div>Goals Achieved</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">🎯</div>
                    <div>Ready for Success</div>
                </div>
            </div>
            
            <p><strong>During your probation period, you have demonstrated:</strong></p>
            <ul>
                <li>✅ Excellent work performance and dedication</li>
                <li>✅ Strong commitment to our organizational values</li>
                <li>✅ Professional growth and adaptability</li>
                <li>✅ Positive contribution to your team</li>
                <li>✅ Alignment with company culture and goals</li>
            </ul>
            
            <p><strong>🎊 What happens next?</strong></p>
            <ul>
                <li>🏢 Your employment status is now <strong>permanent</strong></li>
                <li>💼 You have access to all regular employee benefits</li>
                <li>📈 Annual performance reviews will guide your career growth</li>
                <li>🚀 Opportunities for advancement and development are available</li>
                <li>🎯 You can now participate in all employee programs</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 18px; color: #28a745; font-weight: bold;">
                    Welcome to the Regular Employee Team! 🎉
                </p>
            </div>
            
            <p>We are excited to continue working with you and look forward to your continued success and growth within our organization.</p>
            
            <p>If you have any questions about your new employment status, benefits, or career development opportunities, please don't hesitate to contact the HR department.</p>
            
            <p>Once again, <strong>congratulations</strong> on this significant achievement!</p>
            
            <p>Best regards,<br>
            <strong>OALASS HR Department</strong><br>
            Online Application for Leave of Absence System<br>
            <em>Email sent on ${new Date().toDateString()}</em></p>
        </div>
        
        <div class="footer">
            <p>🏢 This is an automated notification from the OALASS system.</p>
            <p>📧 Please do not reply to this email. For support, contact your HR department.</p>
            <p>🌐 Visit our employee portal for more information about your benefits.</p>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #999;">
                    OALASS - Online Application for Leave of Absence System<br>
                    Streamlining HR processes with modern technology
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `
  }

  private generateProbationCompletionText(userName: string, probationEndDate: Date): string {
    return `
🎉 CONGRATULATIONS! Your Probation Period is Complete

Dear ${userName},

We are delighted to inform you that your probation period has been successfully completed as of ${probationEndDate.toDateString()}.

🌟 YOU ARE NOW A REGULAR EMPLOYEE! 🌟

This promotion comes with all the benefits and privileges of being a permanent member of our team.

ACHIEVEMENTS DURING PROBATION:
✅ Excellent work performance and dedication
✅ Strong commitment to our organizational values  
✅ Professional growth and adaptability
✅ Positive contribution to your team
✅ Alignment with company culture and goals

🎊 WHAT HAPPENS NEXT:
🏢 Your employment status is now PERMANENT
💼 You have access to all regular employee benefits
📈 Annual performance reviews will guide your career growth
🚀 Opportunities for advancement and development are available
🎯 You can now participate in all employee programs

Welcome to the Regular Employee Team! 🎉

We are excited to continue working with you and look forward to your continued success and growth within our organization.

If you have any questions about your new employment status, benefits, or career development opportunities, please don't hesitate to contact the HR department.

Once again, congratulations on this significant achievement!

Best regards,
OALASS HR Department
Online Application for Leave of Absence System
Email sent on ${new Date().toDateString()}

---
🏢 This is an automated notification from the OALASS system.
📧 Please do not reply to this email. For support, contact your HR department.
🌐 Visit our employee portal for more information about your benefits.

OALASS - Online Application for Leave of Absence System
Streamlining HR processes with modern technology
    `
  }

  // Leave Application Email Functions
  async sendLeaveApplicationApprovedEmail(
    userEmail: string,
    userName: string,
    applicationId: number,
    deanName: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`📧 Sending leave approval email to: ${userEmail}`)
      
      const emailContent = {
        from: 'OALASS Dean Office <dean@oalass.dev>',
        to: [userEmail],
        subject: '✅ Your Leave Application Has Been Approved - OALASS',
        html: this.generateLeaveApprovalHTML(userName, applicationId, deanName),
        text: this.generateLeaveApprovalText(userName, applicationId, deanName)
      }

      return await this.sendViaGmailSMTP(emailContent, userEmail, userName, new Date())
      
    } catch (error) {
      console.error('❌ Failed to send leave approval email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async sendLeaveApplicationRejectedEmail(
    userEmail: string,
    userName: string,
    applicationId: number,
    deanName: string,
    rejectionReason: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`📧 Sending leave rejection email to: ${userEmail}`)
      
      const emailContent = {
        from: 'OALASS Dean Office <dean@oalass.dev>',
        to: [userEmail],
        subject: '❌ Your Leave Application Has Been Rejected - OALASS',
        html: this.generateLeaveRejectionHTML(userName, applicationId, deanName, rejectionReason),
        text: this.generateLeaveRejectionText(userName, applicationId, deanName, rejectionReason)
      }

      return await this.sendViaGmailSMTP(emailContent, userEmail, userName, new Date())
      
    } catch (error) {
      console.error('❌ Failed to send leave rejection email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private generateLeaveApprovalHTML(userName: string, applicationId: number, deanName: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Leave Application Approved</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .highlight {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Leave Application Approved</h1>
            <p>Your request has been approved by the Dean</p>
        </div>
        
        <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            
            <p>We are pleased to inform you that your leave application has been <strong>approved</strong> by the Dean's Office.</p>
            
            <div class="highlight">
                <p><strong>Application Details:</strong></p>
                <ul>
                    <li>Application ID: #${applicationId}</li>
                    <li>Status: <strong style="color: #28a745;">APPROVED</strong></li>
                    <li>Approved by: ${deanName}</li>
                    <li>Approval Date: ${new Date().toDateString()}</li>
                </ul>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>✅ Your leave has been officially approved</li>
                <li>📋 Please ensure all necessary arrangements are made for your absence</li>
                <li>📞 Notify your immediate supervisor about your approved leave</li>
                <li>📅 Mark your calendar with the approved leave dates</li>
                <li>📝 Keep a copy of this approval for your records</li>
            </ul>
            
            <p>If you have any questions about your approved leave or need to make any changes, please contact the Dean's Office as soon as possible.</p>
            
            <p>We wish you a pleasant and restful leave period!</p>
            
            <p>Best regards,<br>
            <strong>OALASS Dean Office</strong><br>
            Online Application for Leave of Absence System<br>
            <em>Email sent on ${new Date().toDateString()}</em></p>
        </div>
        
        <div class="footer">
            <p>🏢 This is an automated notification from the OALASS system.</p>
            <p>📧 Please do not reply to this email. For support, contact the Dean's Office.</p>
            <p>🌐 Visit our employee portal for more information about leave policies.</p>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #999;">
                    OALASS - Online Application for Leave of Absence System<br>
                    Streamlining HR processes with modern technology
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `
  }

  private generateLeaveApprovalText(userName: string, applicationId: number, deanName: string): string {
    return `
✅ LEAVE APPLICATION APPROVED

Dear ${userName},

We are pleased to inform you that your leave application has been APPROVED by the Dean's Office.

APPLICATION DETAILS:
- Application ID: #${applicationId}
- Status: APPROVED
- Approved by: ${deanName}
- Approval Date: ${new Date().toDateString()}

NEXT STEPS:
✅ Your leave has been officially approved
📋 Please ensure all necessary arrangements are made for your absence
📞 Notify your immediate supervisor about your approved leave
📅 Mark your calendar with the approved leave dates
📝 Keep a copy of this approval for your records

If you have any questions about your approved leave or need to make any changes, please contact the Dean's Office as soon as possible.

We wish you a pleasant and restful leave period!

Best regards,
OALASS Dean Office
Online Application for Leave of Absence System
Email sent on ${new Date().toDateString()}

---
🏢 This is an automated notification from the OALASS system.
📧 Please do not reply to this email. For support, contact the Dean's Office.
🌐 Visit our employee portal for more information about leave policies.

OALASS - Online Application for Leave of Absence System
Streamlining HR processes with modern technology
    `
  }

  private generateLeaveRejectionHTML(userName: string, applicationId: number, deanName: string, rejectionReason: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Leave Application Rejected</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .highlight {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .reason-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Leave Application Rejected</h1>
            <p>Your request has been reviewed by the Dean</p>
        </div>
        
        <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            
            <p>We regret to inform you that your leave application has been <strong>rejected</strong> by the Dean's Office.</p>
            
            <div class="highlight">
                <p><strong>Application Details:</strong></p>
                <ul>
                    <li>Application ID: #${applicationId}</li>
                    <li>Status: <strong style="color: #dc3545;">REJECTED</strong></li>
                    <li>Reviewed by: ${deanName}</li>
                    <li>Review Date: ${new Date().toDateString()}</li>
                </ul>
            </div>
            
            <div class="reason-box">
                <p><strong>Rejection Reason:</strong></p>
                <p style="font-style: italic; margin: 10px 0;">"${rejectionReason}"</p>
            </div>
            
            <p><strong>What you can do:</strong></p>
            <ul>
                <li>📞 Contact the Dean's Office to discuss the rejection</li>
                <li>📝 Review the rejection reason and address any concerns</li>
                <li>🔄 Consider submitting a new application with additional information</li>
                <li>📅 If urgent, discuss alternative arrangements with your supervisor</li>
                <li>💬 Seek clarification if the reason is unclear</li>
            </ul>
            
            <p>We understand this may be disappointing, and we encourage you to reach out if you need any clarification or assistance.</p>
            
            <p>Best regards,<br>
            <strong>OALASS Dean Office</strong><br>
            Online Application for Leave of Absence System<br>
            <em>Email sent on ${new Date().toDateString()}</em></p>
        </div>
        
        <div class="footer">
            <p>🏢 This is an automated notification from the OALASS system.</p>
            <p>📧 Please do not reply to this email. For support, contact the Dean's Office.</p>
            <p>🌐 Visit our employee portal for more information about leave policies.</p>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #999;">
                    OALASS - Online Application for Leave of Absence System<br>
                    Streamlining HR processes with modern technology
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `
  }

  private generateLeaveRejectionText(userName: string, applicationId: number, deanName: string, rejectionReason: string): string {
    return `
❌ LEAVE APPLICATION REJECTED

Dear ${userName},

We regret to inform you that your leave application has been REJECTED by the Dean's Office.

APPLICATION DETAILS:
- Application ID: #${applicationId}
- Status: REJECTED
- Reviewed by: ${deanName}
- Review Date: ${new Date().toDateString()}

REJECTION REASON:
"${rejectionReason}"

WHAT YOU CAN DO:
📞 Contact the Dean's Office to discuss the rejection
📝 Review the rejection reason and address any concerns
🔄 Consider submitting a new application with additional information
📅 If urgent, discuss alternative arrangements with your supervisor
💬 Seek clarification if the reason is unclear

We understand this may be disappointing, and we encourage you to reach out if you need any clarification or assistance.

Best regards,
OALASS Dean Office
Online Application for Leave of Absence System
Email sent on ${new Date().toDateString()}

---
🏢 This is an automated notification from the OALASS system.
📧 Please do not reply to this email. For support, contact the Dean's Office.
🌐 Visit our employee portal for more information about leave policies.

OALASS - Online Application for Leave of Absence System
Streamlining HR processes with modern technology
    `
  }
}

// Export a default instance
export const realEmailService = RealEmailService.getInstance()
