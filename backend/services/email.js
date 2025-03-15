// backend/services/email.js
const mailgun = require('mailgun-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Initialize Mailgun with API key and domain
const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
  host: 'api.mailgun.net'
});

console.log('Environment variables loaded:', {
  apiKey: process.env.MAILGUN_API_KEY ? 'Found (starts with: ' + process.env.MAILGUN_API_KEY.slice(0,8) + '...)' : 'Missing',
  domain: process.env.MAILGUN_DOMAIN,
  fromAddress: process.env.MAILGUN_FROM_ADDRESS
});

const emailService = {
  async sendEmail({ to, subject, html }) {
    const data = {
      from: process.env.MAILGUN_FROM_ADDRESS || 'no-reply@cigarpalate.com',
      to,
      subject,
      html
    };

    console.log('Attempting to send email with data:', {
      to: data.to,
      from: data.from,
      subject: data.subject,
      domain: mg.domain
    });

    try {
      await mg.messages().send(data);
      console.log('Email sent successfully to:', to);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  },

  // Your existing email templates remain the same
  getApprovalEmailTemplate(cigarName, cigarId) {
    const cigarUrl = `${process.env.FRONTEND_URL}/cigars/${cigarId}`;
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2C3E50;">Good news! Your cigar submission has been approved 🎉</h2>
        <p style="color: #34495E; font-size: 16px;">
          Your submission for "${cigarName}" has been reviewed and approved by our administrators.
          It is now live in our database!
        </p>
        <p style="color: #34495E; font-size: 16px;">
          You can view your approved submission here:
          <a href="${cigarUrl}" style="color: #3498DB; text-decoration: underline;">View Your Cigar Entry</a>
        </p>
        <p style="color: #34495E; font-size: 16px;">
          Thank you for contributing to our community. Your expertise helps make our
          database more comprehensive and valuable for cigar enthusiasts.
        </p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #BDC3C7;">
          <p style="color: #7F8C8D; font-size: 14px;">
            Best regards,<br/>
            The Cigar Palate Administrative Team
          </p>
        </div>
      </div>
    `;
  },

  getDeclineEmailTemplate(cigarName, notes) {
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2C3E50;">Update on Your Cigar Submission</h2>
        <p style="color: #34495E; font-size: 16px;">
          Your submission for "${cigarName}" has been reviewed but could not be approved
          at this time.
        </p>
        ${notes ? `
          <div style="background-color: #F8F9F9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #34495E; font-size: 16px; margin: 0;">
              <strong>Admin Notes:</strong><br/>
              ${notes}
            </p>
          </div>
        ` : ''}
        <p style="color: #34495E; font-size: 16px;">
          You're welcome to submit again with the necessary adjustments. If you have any
          questions, please don't hesitate to reach out.
        </p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #BDC3C7;">
          <p style="color: #7F8C8D; font-size: 14px;">
            Best regards,<br/>
            The Cigar Palate Administrative Team
          </p>
        </div>
      </div>
    `;
  },

  getPasswordResetEmailTemplate(resetLink, username) {
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2C3E50;">Password Reset Request</h2>
        <p style="color: #34495E; font-size: 16px;">
          Hello${username ? ` ${username}` : ''},
        </p>
        <p style="color: #34495E; font-size: 16px;">
          We received a request to reset your password. If you didn't make this request,
          you can safely ignore this email. The link will expire in 1 hour.
        </p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}"
             style="background-color: #3498DB; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #34495E; font-size: 16px;">
          If the button above doesn't work, you can copy and paste this link into your browser:
          <br>
          <span style="color: #7F8C8D; word-break: break-all;">${resetLink}</span>
        </p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #BDC3C7;">
          <p style="color: #7F8C8D; font-size: 14px;">
            Best regards,<br/>
            The Cigar Palate Team
          </p>
        </div>
      </div>
    `;
  },

  async sendPasswordResetEmail(email, resetToken) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    try {
      await this.sendEmail({
        to: email,
        subject: 'Reset Your Password',
        html: this.getPasswordResetEmailTemplate(resetLink)
      });
      console.log('Password reset email sent successfully to:', email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  },

  getVerificationEmailTemplate(verificationLink, username) {
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2C3E50;">Verify Your Email Address</h2>
        <p style="color: #34495E; font-size: 16px;">
          Hello ${username},
        </p>
        <p style="color: #34495E; font-size: 16px;">
          Thank you for registering with CigarPalate.com! Please verify your email address by clicking the button below:
        </p>
        <div style="margin: 30px 0;">
          <a href="${verificationLink}"
             style="background-color: #3498DB; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #34495E; font-size: 16px;">
          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        <p style="color: #34495E; font-size: 16px;">
          If the button above doesn't work, you can copy and paste this link into your browser:
          <br>
          <span style="color: #7F8C8D; word-break: break-all;">${verificationLink}</span>
        </p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #BDC3C7;">
          <p style="color: #7F8C8D; font-size: 14px;">
            Best regards,<br/>
            The Cigar Palate Team
          </p>
        </div>
      </div>
    `;
  },

  async sendVerificationEmail(email, username, verificationToken) {
    if (!process.env.FRONTEND_URL) {
      console.error('FRONTEND_URL environment variable is not set');
      throw new Error('Server configuration error');
    }

    const baseUrl = process.env.FRONTEND_URL.trim().replace(/\/$/, '');

    // Add protocol/domain logging
  try {
    const urlObj = new URL(baseUrl);
    console.log('Email verification URL details:', {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      includesWww: urlObj.hostname.startsWith('www.'),
      port: urlObj.port || 'default'
    });
    
    // Check for HTTP instead of HTTPS
    if (urlObj.protocol === 'http:') {
      console.warn('⚠️ WARNING: Using non-secure HTTP URL for verification emails');
    }
  } catch (e) {
    console.error('Invalid FRONTEND_URL format:', baseUrl);
  }
  
    const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;

    try {
      const emailHtml = this.getVerificationEmailTemplate(verificationLink, username);
      await this.sendEmail({
        to: email,
        subject: 'Verify Your Email Address',
        html: emailHtml
      });
      console.log('Verification email sent successfully to:', email);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  },

  getNotificationReminderTemplate(username, notifications) {
    const getNotificationLink = (notification) => {
      try {
          if (!notification) {
              console.error('Notification object is null or undefined');
              return process.env.FRONTEND_URL;
          }
  
          switch (notification.type) {
              case 'thread':
                  if (!notification.thread_id) {
                      console.error(`Missing thread_id for thread notification ${notification.id}`);
                      return process.env.FRONTEND_URL;
                  }
                  return `${process.env.FRONTEND_URL}/forum/thread/${notification.thread_id}`;
                  
              case 'reply':
                  if (!notification.thread_id) {
                      console.error(`Missing thread_id for reply notification ${notification.id}`, 
                          notification.debug_info || 'No debug info available');
                      return process.env.FRONTEND_URL;
                  }
                  return `${process.env.FRONTEND_URL}/forum/thread/${notification.thread_id}?highlight=${notification.reference_id}`;
                  
              case 'review':
              case 'review_reply':
                  if (!notification.cigar_id) {
                      console.error(`Missing cigar_id for ${notification.type} notification ${notification.id}`);
                      return process.env.FRONTEND_URL;
                  }
                  return `${process.env.FRONTEND_URL}/cigars/${notification.cigar_id}?highlight=${notification.reference_id}`;
                  
              case 'follow':
                  if (!notification.actor) {
                      console.error(`Missing actor for follow notification ${notification.id}`);
                      return process.env.FRONTEND_URL;
                  }
                  return `${process.env.FRONTEND_URL}/profile/${notification.actor}`;
                  
              default:
                  console.warn(`Unknown notification type: ${notification.type}`);
                  return process.env.FRONTEND_URL;
          }
      } catch (error) {
          console.error('Error generating notification link:', error, { notification });
          return process.env.FRONTEND_URL;
      }
  };

    const notificationPreviews = notifications.map(notification => {
      const link = getNotificationLink(notification);
      return `<a href="${link}" 
                style="display: block; text-decoration: none; color: #34495E; 
                       padding: 6px; margin: 12px 0; background-color: #fff; 
                       border: 3px solid #E1E8ED; border-radius: 4px;
                       text-align: center; font-weight: 500;
                       transition: background-color 0.2s ease;">
                ${notification.message}
              </a>`;
    }).join('\n');

    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2C3E50;">You have unread notifications</h2>
        <p style="color: #34495E; font-size: 16px;">
          Hello ${username},
        </p>
        <p style="color: #34495E; font-size: 16px;">
          You have several unread notifications on CigarPalate. Here are your most recent notifications:
        </p>
        <div style="padding: 15px; border-radius: 5px; margin: 20px 0;">
  <div style="color: #34495E; font-size: 16px;">
    ${notificationPreviews}
  </div>
</div>
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}"
             style="background-color: #3498DB; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            View More
          </a>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #BDC3C7;">
          <p style="color: #7F8C8D; font-size: 14px;">
            Best regards,<br/>
            The Cigar Palate Team
          </p>
        </div>
      </div>
    `;
  },

  async sendNotificationReminderEmail(user, notifications) {
    try {
        // Validate notifications before processing
        const validNotifications = notifications.filter(notification => {
            // Basic structure validation
            if (!notification || typeof notification !== 'object') {
                console.error('Invalid notification object:', notification);
                return false;
            }

            // Type-specific validation
            switch (notification.type) {
                case 'reply':
                    if (!notification.thread_id) {
                        console.error(`Skipping reply notification ${notification.id} - missing thread_id`);
                        return false;
                    }
                    break;
                case 'review':
                case 'review_reply':
                    if (!notification.cigar_id) {
                        console.error(`Skipping ${notification.type} notification ${notification.id} - missing cigar_id`);
                        return false;
                    }
                    break;
                case 'follow':
                    if (!notification.actor) {
                        console.error(`Skipping follow notification ${notification.id} - missing actor`);
                        return false;
                    }
                    break;
            }
            return true;
        });

        if (validNotifications.length === 0) {
            console.warn(`No valid notifications to send for user ${user.email}`);
            return;
        }

        await this.sendEmail({
            to: user.email,
            subject: 'You have unread notifications on CigarPalate',
            html: this.getNotificationReminderTemplate(user.username, validNotifications)
        });
        console.log('Notification reminder email sent successfully to:', user.email);
    } catch (error) {
        console.error('Error sending notification reminder email:', error);
        throw new Error('Failed to send notification reminder email');
    }
}
};

module.exports = emailService;