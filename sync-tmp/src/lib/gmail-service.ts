import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export class GmailService {
  private static instance: GmailService
  private transporter: nodemailer.Transporter | null = null
  
  static getInstance(): GmailService {
    if (!GmailService.instance) {
      GmailService.instance = new GmailService()
    }
    return GmailService.instance
  }

  private async createTransporter() {
    if (this.transporter) {
      return this.transporter
    }

    // For testing purposes, we'll use Ethereal Email (free testing service)
    // In production, you would use real Gmail credentials
    try {
      // Create test account for demonstration
      const testAccount = await nodemailer.createTestAccount()
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })

      console.log('📧 Test email service initialized')
      console.log(`Test account: ${testAccount.user}`)
      
      return this.transporter
    } catch (error) {
      console.error('Failed to create email transporter:', error)
      throw error
    }
  }

  async sendProbationCompletionEmail(
    userEmail: string,
    userName: string,
    probationEndDate: Date
  ): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
    try {
      const transporter = await this.createTransporter()
      
      if (!transporter) {
        throw new Error('Failed to create email transporter')
      }
      
      const emailOptions: EmailOptions = {
        to: userEmail,
        subject: '🎉 Congratulations! Your Probation Period is Complete - OALASS',
        html: this.generateProbationCompletionHTML(userName, probationEndDate),
        text: this.generateProbationCompletionText(userName, probationEndDate)
      }

      console.log(`📧 Sending probation completion email to: ${userEmail}`)
      
      const info = await transporter.sendMail({
        from: '"OALASS HR Department" <hr@oalass.com>',
        to: emailOptions.to,
        subject: emailOptions.subject,
        text: emailOptions.text,
        html: emailOptions.html,
      })

      // Get preview URL for Ethereal Email
      const previewUrl = nodemailer.getTestMessageUrl(info)
      
      console.log('✅ Email sent successfully!')
      console.log(`Message ID: ${info.messageId}`)
      if (previewUrl) {
        console.log(`Preview URL: ${previewUrl}`)
      }
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || undefined
      }
      
    } catch (error) {
      console.error('❌ Failed to send probation completion email:', error)
      return { success: false }
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
        .stats {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            text-align: center;
        }
        .stat-item {
            flex: 1;
            padding: 10px;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #28a745;
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
            
            <p>During your probation period, you have demonstrated:</p>
            <ul>
                <li>Excellent work performance and dedication</li>
                <li>Strong commitment to our organizational values</li>
                <li>Professional growth and adaptability</li>
                <li>Positive contribution to your team</li>
                <li>Alignment with company culture and goals</li>
            </ul>
            
            <p><strong>What happens next?</strong></p>
            <ul>
                <li>Your employment status is now permanent</li>
                <li>You have access to all regular employee benefits</li>
                <li>Annual performance reviews will guide your career growth</li>
                <li>Opportunities for advancement and development are available</li>
            </ul>
            
            <p>We are excited to continue working with you and look forward to your continued success and growth within our organization.</p>
            
            <p>If you have any questions about your new employment status, benefits, or career development opportunities, please don't hesitate to contact the HR department.</p>
            
            <p>Once again, congratulations on this significant achievement!</p>
            
            <p>Best regards,<br>
            <strong>OALASS HR Department</strong><br>
            Online Application for Leave of Absence System<br>
            <em>Email sent on ${new Date().toDateString()}</em></p>
        </div>
        
        <div class="footer">
            <p>🏢 This is an automated notification from the OALASS system.</p>
            <p>📧 Please do not reply to this email. For support, contact your HR department.</p>
            <p>🌐 Visit our employee portal for more information about your benefits.</p>
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

During your probation period, you have demonstrated:
✓ Excellent work performance and dedication
✓ Strong commitment to our organizational values
✓ Professional growth and adaptability
✓ Positive contribution to your team
✓ Alignment with company culture and goals

WHAT HAPPENS NEXT:
• Your employment status is now permanent
• You have access to all regular employee benefits
• Annual performance reviews will guide your career growth
• Opportunities for advancement and development are available

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
    `
  }
}

// Export a default instance
export const gmailService = GmailService.getInstance()
