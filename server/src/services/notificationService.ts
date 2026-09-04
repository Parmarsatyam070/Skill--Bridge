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

export interface NotificationResult {
  success: boolean;
  mode: 'provider' | 'console-fallback';
  provider?: string;
  messageId?: string;
}

/**
 * Dispatches a password reset email using available transactional email providers
 * (Resend / SendGrid) or clean fallback in development
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
  token,
}: {
  to: string;
  resetUrl: string;
  token: string;
}): Promise<NotificationResult> {
  const subject = 'Reset Your SkillBridge Password';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0d9488;">SkillBridge Career Console</span>
        <h2 style="color: #0f172a; margin: 6px 0 0 0; font-size: 22px;">Reset Your Password</h2>
      </div>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">We received a request to reset the password for your SkillBridge account associated with <strong>${to}</strong>.</p>
      <div style="margin: 28px 0;">
        <a href="${resetUrl}" style="background-color: #0d9488; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block;">
          Reset Password Now →
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b; line-height: 1.5;">This reset link is valid for <strong>15 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
        SkillBridge Platform • Unified Academia-Industry Ecosystem
      </div>
    </div>
  `;

  // 1. Check for Resend API Key
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'SkillBridge <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
        }),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Resend delivery failed with status ${res.status}`);
      }

      console.log(`[EMAIL DISPATCH - RESEND] Successfully sent reset link to ${to} (ID: ${data.id})`);
      return { success: true, mode: 'provider', provider: 'Resend', messageId: data.id };
    } catch (err: any) {
      console.error('❌ [EMAIL DISPATCH ERROR - RESEND]:', err.message);
      throw new Error(`Email delivery failed via Resend: ${err.message}`);
    }
  }

  // 2. Check for SendGrid API Key
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  if (sendgridApiKey) {
    try {
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@skillbridge.edu';
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: fromEmail, name: 'SkillBridge' },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`SendGrid API error (${res.status}): ${errorText}`);
      }

      console.log(`[EMAIL DISPATCH - SENDGRID] Successfully dispatched reset link to ${to}`);
      return { success: true, mode: 'provider', provider: 'SendGrid' };
    } catch (err: any) {
      console.error('❌ [EMAIL DISPATCH ERROR - SENDGRID]:', err.message);
      throw new Error(`Email delivery failed via SendGrid: ${err.message}`);
    }
  }

  // 3. Local Development Console Fallback
  console.warn('\n⚠️ [WARN] No email/SMS provider configured — this is a local dev fallback, nothing was actually sent');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log(`│ [DEV EMAIL FALLBACK] Reset Link Dispatched                  │`);
  console.log(`│ To:        ${to.padEnd(48)} │`);
  console.log(`│ Reset URL: ${resetUrl.slice(0, 48).padEnd(48)} │`);
  if (resetUrl.length > 48) {
    console.log(`│            ${resetUrl.slice(48).padEnd(48)} │`);
  }
  console.log(`│ Token:     ${token.padEnd(48)} │`);
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  return { success: true, mode: 'console-fallback', messageId: `dev_email_${Date.now()}` };
}

/**
 * Dispatches a 6-digit SMS OTP using Twilio / MSG91 / Console fallback
 */
export async function sendSmsOtp({
  phone,
  otpCode,
}: {
  phone: string;
  otpCode: string;
}): Promise<NotificationResult> {
  const message = `Your SkillBridge verification OTP is ${otpCode}. Valid for 15 minutes. Do not share this code with anyone.`;

  // 1. Check for Twilio Credentials
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', phone);
      params.append('From', twilioFrom);
      params.append('Body', message);

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Twilio SMS failed with status ${res.status}`);
      }

      console.log(`[SMS DISPATCH - TWILIO] Sent OTP to ${phone} (SID: ${data.sid})`);
      return { success: true, mode: 'provider', provider: 'Twilio', messageId: data.sid };
    } catch (err: any) {
      console.error('❌ [SMS DISPATCH ERROR - TWILIO]:', err.message);
      throw new Error(`SMS delivery failed via Twilio: ${err.message}`);
    }
  }

  // 2. Check for MSG91 Credentials
  const msg91AuthKey = process.env.MSG91_AUTH_KEY;
  const msg91TemplateId = process.env.MSG91_TEMPLATE_ID;
  if (msg91AuthKey) {
    try {
      const res = await fetch('https://api.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'authkey': msg91AuthKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: msg91TemplateId || 'default',
          mobile: phone.replace(/[^0-9]/g, ''),
          otp: otpCode,
        }),
      });

      const data: any = await res.json();
      if (!res.ok || data.type === 'error') {
        throw new Error(data.message || 'MSG91 OTP dispatch failed');
      }

      console.log(`[SMS DISPATCH - MSG91] Sent OTP to ${phone}`);
      return { success: true, mode: 'provider', provider: 'MSG91' };
    } catch (err: any) {
      console.error('❌ [SMS DISPATCH ERROR - MSG91]:', err.message);
      throw new Error(`SMS delivery failed via MSG91: ${err.message}`);
    }
  }

  // 3. Local Development Console Fallback
  console.warn('\n⚠️ [WARN] No email/SMS provider configured — this is a local dev fallback, nothing was actually sent');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log(`│ [DEV SMS OTP FALLBACK] OTP Dispatched                       │`);
  console.log(`│ Phone:     ${phone.padEnd(48)} │`);
  console.log(`│ OTP Code:  ${otpCode.padEnd(48)} │`);
  console.log(`│ Message:   ${message.slice(0, 48).padEnd(48)} │`);
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  return { success: true, mode: 'console-fallback', messageId: `dev_sms_${Date.now()}` };
}
