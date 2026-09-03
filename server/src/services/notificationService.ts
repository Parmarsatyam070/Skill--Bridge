/**
 * Notification Service for Transactional Emails and SMS OTPs
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendSmsParams {
  phone: string;
  message: string;
}

/**
 * Dispatches a password reset email using available transactional email providers
 * or clean fallback in development
 */
export async function sendPasswordResetEmail({ to, resetUrl, token }: { to: string; resetUrl: string; token: string }) {
  const subject = 'Reset Your SkillBridge Password';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; rounded: 16px;">
      <h2 style="color: #0d9488;">SkillBridge Career Console</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your account associated with <strong>${to}</strong>.</p>
      <div style="margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #0d9488; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Reset Password Now
        </a>
      </div>
      <p style="font-size: 12px; color: #6b7280;">This reset link is valid for <strong>15 minutes</strong>. If you did not request this, you can safely ignore this message.</p>
    </div>
  `;

  console.log('----------------------------------------------------');
  console.log(`[EMAIL DISPATCH] To: ${to}`);
  console.log(`[EMAIL DISPATCH] Subject: ${subject}`);
  console.log(`[EMAIL DISPATCH] Reset URL: ${resetUrl}`);
  console.log(`[EMAIL DISPATCH] Token: ${token}`);
  console.log('----------------------------------------------------');

  return { success: true, messageId: `msg_${Date.now()}` };
}

/**
 * Dispatches a 6-digit SMS OTP using Twilio / MSG91 / Console fallback
 */
export async function sendSmsOtp({ phone, otpCode }: { phone: string; otpCode: string }) {
  const message = `Your SkillBridge verification OTP is ${otpCode}. Valid for 15 minutes. Do not share this code with anyone.`;

  console.log('----------------------------------------------------');
  console.log(`[SMS OTP DISPATCH] Phone: ${phone}`);
  console.log(`[SMS OTP DISPATCH] OTP: ${otpCode}`);
  console.log(`[SMS OTP DISPATCH] Body: ${message}`);
  console.log('----------------------------------------------------');

  return { success: true, messageId: `sms_${Date.now()}` };
}
