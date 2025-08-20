// Email service for sending probation completion notifications
// This service can be integrated with the automatic probation checker

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export class EmailService {
  private static instance: EmailService
  
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendProbationCompletionEmail(
    userEmail: string,
    userName: string,
    probationEndDate: Date
  ): Promise<boolean> {
    try {
      const emailOptions: EmailOptions = {
        to: userEmail,
        subject: 'Congratulations! Your Probation Period is Complete - OALASS',
        html: this.generateProbationCompletionHTML(userName, probationEndDate),
        text: this.generateProbationCompletionText(userName, probationEndDate)
      }

      // For demonstration purposes, we'll log the email
      // In production, you would integrate with an email service like:
      // - Nodemailer with SMTP
      // - SendGrid
      // - AWS SES
      // - Resend
      console.log('📧 SENDING EMAIL NOTIFICATION:')
      console.log('='.repeat(60))
      console.log(`To: ${emailOptions.to}`)
      console.log(`Subject: ${emailOptions.subject}`)
      console.log('\nHTML Content:')
      console.log(emailOptions.html)
      console.log('\nText Content:')
      console.log(emailOptions.text)
      console.log('='.repeat(60))
      
      // Simulate successful email sending
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('✅ Email sent successfully!')
      return true
      
    } catch (error) {
      console.error('❌ Failed to send probation completion email:', error)
      return false
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
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .highlight {
            background-color: #e8f5e8;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            background-color: #28a745;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Congratulations!</h1>
            <p>Your Probation Period is Complete</p>
        </div>
        
        <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            
            <p>We are delighted to inform you that your probation period has been successfully completed as of <strong>${probationEndDate.toDateString()}</strong>.</p>
            
            <div class="highlight">
                <h3>🌟 You are now a Regular Employee!</h3>
                <p>This promotion comes with all the benefits and privileges of being a permanent member of our team.</p>
            </div>
            
            <p>During your probation period, you have demonstrated:</p>
            <ul>
                <li>Excellent work performance</li>
                <li>Commitment to our organizational values</li>
                <li>Professional growth and adaptability</li>
                <li>Positive contribution to the team</li>
            </ul>
            
            <p>We are excited to continue working with you and look forward to your continued success and growth within our organization.</p>
            
            <p>If you have any questions about your new employment status or benefits, please don't hesitate to contact the HR department.</p>
            
            <p>Once again, congratulations on this achievement!</p>
            
            <p>Best regards,<br>
            <strong>OALASS HR Department</strong><br>
            Online Application for Leave of Absence System</p>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from the OALASS system.</p>
            <p>Please do not reply to this email. For support, contact your HR department.</p>
        </div>
    </div>
</body>
</html>
    `
  }

  private generateProbationCompletionText(userName: string, probationEndDate: Date): string {
    return `
CONGRATULATIONS! Your Probation Period is Complete

Dear ${userName},

We are delighted to inform you that your probation period has been successfully completed as of ${probationEndDate.toDateString()}.

YOU ARE NOW A REGULAR EMPLOYEE!

This promotion comes with all the benefits and privileges of being a permanent member of our team.

During your probation period, you have demonstrated:
- Excellent work performance
- Commitment to our organizational values
- Professional growth and adaptability
- Positive contribution to the team

We are excited to continue working with you and look forward to your continued success and growth within our organization.

If you have any questions about your new employment status or benefits, please don't hesitate to contact the HR department.

Once again, congratulations on this achievement!

Best regards,
OALASS HR Department
Online Application for Leave of Absence System

---
This is an automated notification from the OALASS system.
Please do not reply to this email. For support, contact your HR department.
    `
  }

  // Finance approval/rejection email functions
  async sendFinanceApprovalEmail(
    userEmail: string,
    userName: string,
    applicationId: number,
    leaveType: string,
    startDate: string,
    endDate: string
  ): Promise<boolean> {
    try {
      const emailOptions: EmailOptions = {
        to: userEmail,
        subject: 'Leave Application Fully Approved - Ready for Printing - OALASS',
        html: this.generateFinanceApprovalHTML(userName, applicationId, leaveType, startDate, endDate),
        text: this.generateFinanceApprovalText(userName, applicationId, leaveType, startDate, endDate)
      }

      console.log('📧 SENDING FINANCE APPROVAL EMAIL:')
      console.log('='.repeat(60))
      console.log(`To: ${emailOptions.to}`)
      console.log(`Subject: ${emailOptions.subject}`)
      console.log('\nHTML Content:')
      console.log(emailOptions.html)
      console.log('\nText Content:')
      console.log(emailOptions.text)
      console.log('='.repeat(60))
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('✅ Finance approval email sent successfully!')
      return true
      
    } catch (error) {
      console.error('❌ Failed to send finance approval email:', error)
      return false
    }
  }

  async sendFinanceRejectionEmail(
    userEmail: string,
    userName: string,
    applicationId: number,
    rejectionReason: string
  ): Promise<boolean> {
    try {
      const emailOptions: EmailOptions = {
        to: userEmail,
        subject: 'Leave Application Rejected - OALASS',
        html: this.generateFinanceRejectionHTML(userName, applicationId, rejectionReason),
        text: this.generateFinanceRejectionText(userName, applicationId, rejectionReason)
      }

      console.log('📧 SENDING FINANCE REJECTION EMAIL:')
      console.log('='.repeat(60))
      console.log(`To: ${emailOptions.to}`)
      console.log(`Subject: ${emailOptions.subject}`)
      console.log('\nHTML Content:')
      console.log(emailOptions.html)
      console.log('\nText Content:')
      console.log(emailOptions.text)
      console.log('='.repeat(60))
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('✅ Finance rejection email sent successfully!')
      return true
      
    } catch (error) {
      console.error('❌ Failed to send finance rejection email:', error)
      return false
    }
  }

  private generateFinanceApprovalHTML(userName: string, applicationId: number, leaveType: string, startDate: string, endDate: string): string {
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
            background-color: #e8f5e8;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 20px 0;
        }
        .details {
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            background-color: #28a745;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Leave Application Approved</h1>
            <p>Your application is ready for printing</p>
        </div>
        
        <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            
            <div class="highlight">
                <h3>🎉 Congratulations! Your leave application has been fully approved!</h3>
                <p>Your application has been reviewed and approved by both the Dean and Finance Department. It is now ready for printing.</p>
            </div>
            
            <div class="details">
                <h4>Application Details:</h4>
                <p><strong>Leave Type:</strong> ${leaveType}</p>
                <p><strong>Start Date:</strong> ${startDate}</p>
                <p><strong>End Date:</strong> ${endDate}</p>
                <p><strong>Application ID:</strong> #${applicationId}</p>
            </div>
            
            <p>You can now:</p>
            <ul>
                <li>Print your approved leave application</li>
                <li>Submit it to the HR department</li>
                <li>Keep a copy for your records</li>
            </ul>
            
            <p>Please ensure you follow all institutional policies regarding leave procedures.</p>
            
            <p>If you have any questions, please contact the HR department.</p>
            
            <p>Best regards,<br>
            <strong>OALASS Finance Department</strong><br>
            Online Application for Leave of Absence System</p>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from the OALASS system.</p>
            <p>Please do not reply to this email. For support, contact your HR department.</p>
        </div>
    </div>
</body>
</html>
    `
  }

  private generateFinanceApprovalText(userName: string, applicationId: number, leaveType: string, startDate: string, endDate: string): string {
    return `
LEAVE APPLICATION APPROVED - READY FOR PRINTING

Dear ${userName},

CONGRATULATIONS! Your leave application has been fully approved!

Your application has been reviewed and approved by both the Dean and Finance Department. It is now ready for printing.

Application Details:
- Leave Type: ${leaveType}
- Start Date: ${startDate}
- End Date: ${endDate}
- Application ID: #${applicationId}

You can now:
- Print your approved leave application
- Submit it to the HR department
- Keep a copy for your records

Please ensure you follow all institutional policies regarding leave procedures.

If you have any questions, please contact the HR department.

Best regards,
OALASS Finance Department
Online Application for Leave of Absence System

---
This is an automated notification from the OALASS system.
Please do not reply to this email. For support, contact your HR department.
    `
  }

  private generateFinanceRejectionHTML(userName: string, applicationId: number, rejectionReason: string): string {
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
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 20px 0;
        }
        .details {
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Leave Application Rejected</h1>
            <p>Your application has been reviewed and rejected</p>
        </div>
        
        <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            
            <div class="highlight">
                <h3>We regret to inform you that your leave application has been rejected.</h3>
                <p>After careful review by the Finance Department, your application could not be approved.</p>
            </div>
            
            <div class="details">
                <h4>Application Details:</h4>
                <p><strong>Application ID:</strong> #${applicationId}</p>
                <p><strong>Rejection Reason:</strong> ${rejectionReason}</p>
            </div>
            
            <p>If you believe this decision was made in error or if you have additional information to provide, please:</p>
            <ul>
                <li>Contact the Finance Department directly</li>
                <li>Provide any additional documentation that may support your case</li>
                <li>Submit a new application if the issues can be resolved</li>
            </ul>
            
            <p>We understand this may be disappointing, and we encourage you to address the concerns raised before submitting a new application.</p>
            
            <p>If you have any questions, please contact the HR department.</p>
            
            <p>Best regards,<br>
            <strong>OALASS Finance Department</strong><br>
            Online Application for Leave of Absence System</p>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from the OALASS system.</p>
            <p>Please do not reply to this email. For support, contact your HR department.</p>
        </div>
    </div>
</body>
</html>
    `
  }

  private generateFinanceRejectionText(userName: string, applicationId: number, rejectionReason: string): string {
    return `
LEAVE APPLICATION REJECTED

Dear ${userName},

We regret to inform you that your leave application has been rejected.

After careful review by the Finance Department, your application could not be approved.

Application Details:
- Application ID: #${applicationId}
- Rejection Reason: ${rejectionReason}

If you believe this decision was made in error or if you have additional information to provide, please:
- Contact the Finance Department directly
- Provide any additional documentation that may support your case
- Submit a new application if the issues can be resolved

We understand this may be disappointing, and we encourage you to address the concerns raised before submitting a new application.

If you have any questions, please contact the HR department.

Best regards,
OALASS Finance Department
Online Application for Leave of Absence System

---
This is an automated notification from the OALASS system.
Please do not reply to this email. For support, contact your HR department.
    `
  }
}

// Export a default instance
export const emailService = EmailService.getInstance()
