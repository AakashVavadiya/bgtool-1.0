import nodemailer, { type Transporter } from "nodemailer";

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  appBaseUrl: string;
  isMock: boolean;
}

function getSmtpConfig(): SmtpConfig {
  const host = process.env["SMTP_HOST"] || "smtp.hostinger.com";
  const port = parseInt(process.env["SMTP_PORT"] || "465", 10);
  const secure =
    process.env["SMTP_SECURE"] !== undefined
      ? process.env["SMTP_SECURE"] === "true"
      : port === 465;

  const user = process.env["SMTP_USER"] || "noreply@bg.tools";
  const pass = process.env["SMTP_PASS"] || "";
  const from = process.env["SMTP_FROM"] || "bg.tools <noreply@bg.tools>";
  const appBaseUrl =
    process.env["APP_BASE_URL"] ||
    process.env["SITE_URL"] ||
    "https://bg.tools";

  // Mock enabled if explicit or if SMTP_PASS is missing in dev/test environment
  const isMock =
    process.env["ENABLE_MOCK_EMAIL"] === "true" ||
    process.env["NODE_ENV"] === "test" ||
    (!pass && process.env["NODE_ENV"] !== "production");

  return { host, port, secure, user, pass, from, appBaseUrl, isMock };
}

let transporterInstance: Transporter | null = null;

function getTransporter(): { transporter: Transporter | null; isMock: boolean } {
  const config = getSmtpConfig();

  if (config.isMock) {
    return { transporter: null, isMock: true };
  }

  if (!config.pass) {
    console.warn(
      "[Hostinger Mailer Warning] SMTP_PASS is empty. Outgoing email delivery is queued in mock log mode."
    );
    return { transporter: null, isMock: true };
  }

  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true for 465, false for 587
      auth: {
        user: config.user,
        pass: config.pass,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: true, // Enforce strict TLS certificate verification
      },
    });
  }

  return { transporter: transporterInstance, isMock: false };
}

/**
 * Resets cached transporter (useful when reloading env vars)
 */
export function resetMailerTransporter(): void {
  transporterInstance = null;
}

// Memory sink for test verification
export const mockEmailOutbox: Array<{
  to: string;
  subject: string;
  otp?: string | undefined;
  resetUrl?: string | undefined;
  sentAt: string;
}> = [];

/**
 * Reusable Hostinger Email Service for bg.tools
 */
export const mailer = {
  /**
   * Verify SMTP connection status without sending an email
   */
  async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    const { transporter, isMock } = getTransporter();
    if (isMock) {
      return { success: true };
    }
    if (!transporter) {
      return { success: false, error: "SMTP transporter is not configured." };
    }
    try {
      await transporter.verify();
      return { success: true };
    } catch (err: any) {
      console.error("[Hostinger SMTP Connection Failed]", err?.message);
      return { success: false, error: "Unable to establish connection to Hostinger SMTP." };
    }
  },

  /**
   * Send 6-Digit Email Verification OTP
   */
  async sendVerificationOtp(params: {
    to: string;
    name?: string;
    otp: string;
  }): Promise<SendEmailResult> {
    const config = getSmtpConfig();
    const recipient = params.to.trim().toLowerCase();
    const displayName = params.name?.trim() || "Creator";
    const subject = `Your bg.tools verification code is ${params.otp}`;

    const textContent = `
Hello ${displayName},

Welcome to bg.tools!

Your single-use six-digit verification code is:
${params.otp}

This verification code expires in 10 minutes and can only be used once.

If you did not request this verification code, please ignore this email. Never share this code with anyone.

Best regards,
The bg.tools Team
https://bg.tools
`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your bg.tools Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #f1f5f9; margin: 0; padding: 24px; }
    .container { max-width: 540px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; padding: 36px 32px; }
    .brand { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; text-decoration: none; }
    .brand span { color: #f59e0b; }
    .badge { display: inline-block; background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 20px; }
    h1 { font-size: 22px; font-weight: 800; margin: 16px 0 8px 0; color: #ffffff; }
    p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 8px 0; }
    .otp-card { background: linear-gradient(135deg, #1e293b, #0f172a); border: 2px dashed #f59e0b; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #f59e0b; margin: 0; }
    .otp-sub { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .notice { font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #1f2937; padding-top: 20px; margin-top: 24px; }
    .footer { text-align: center; font-size: 11px; color: #475569; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <a href="https://bg.tools" class="brand">bg<span>.tools</span></a>
    <div><span class="badge">Email Verification</span></div>
    <h1>Verify Your Account</h1>
    <p>Hi ${displayName},</p>
    <p>Thank you for choosing bg.tools. Use the six-digit verification code below to complete your registration and activate your 10 free daily Bronze Tokens.</p>
    
    <div class="otp-card">
      <div class="otp-code">${params.otp}</div>
      <div class="otp-sub">Valid for 10 minutes • Single use only</div>
    </div>

    <p style="font-size: 13px; color: #cbd5e1;">Never share this code with anyone. Our support team will never ask for your verification code.</p>

    <div class="notice">
      If you did not request this verification email, someone may have entered your email address by mistake. You can safely disregard this message.
    </div>
  </div>
  <div class="footer">
    © ${new Date().getFullYear()} bg.tools • High-Precision AI Image Processing<br>
    Support: <a href="mailto:Support@bg.tools" style="color: #64748b;">Support@bg.tools</a>
  </div>
</body>
</html>
`.trim();

    return this.sendMail({
      to: recipient,
      subject,
      text: textContent,
      html: htmlContent,
      metadata: { otp: params.otp },
    });
  },

  /**
   * Send Password Reset Link Email
   */
  async sendPasswordResetEmail(params: {
    to: string;
    name?: string;
    rawToken: string;
  }): Promise<SendEmailResult> {
    const config = getSmtpConfig();
    const recipient = params.to.trim().toLowerCase();
    const displayName = params.name?.trim() || "User";
    const resetUrl = `${config.appBaseUrl}/reset-password?token=${params.rawToken}`;
    const subject = `Reset your bg.tools password`;

    const textContent = `
Hello ${displayName},

We received a request to reset the password for your bg.tools account.

To set a new password, open the link below in your browser:
${resetUrl}

This link is valid for 30 minutes and can only be used once.

If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The bg.tools Team
https://bg.tools
`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your bg.tools Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #f1f5f9; margin: 0; padding: 24px; }
    .container { max-width: 540px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; padding: 36px 32px; }
    .brand { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; text-decoration: none; }
    .brand span { color: #f59e0b; }
    .badge { display: inline-block; background-color: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 20px; }
    h1 { font-size: 22px; font-weight: 800; margin: 16px 0 8px 0; color: #ffffff; }
    p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 8px 0; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #f59e0b; color: #0f172a !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3); }
    .raw-link { word-break: break-all; font-size: 12px; color: #38bdf8; background-color: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #1e293b; margin: 16px 0; }
    .notice { font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #1f2937; padding-top: 20px; margin-top: 24px; }
    .footer { text-align: center; font-size: 11px; color: #475569; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <a href="https://bg.tools" class="brand">bg<span>.tools</span></a>
    <div><span class="badge">Password Assistance</span></div>
    <h1>Reset Your Password</h1>
    <p>Hi ${displayName},</p>
    <p>We received a request to reset your password. Click the secure button below to set a new password for your account.</p>
    
    <div class="btn-container">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>

    <p style="font-size: 13px; color: #cbd5e1;">Or copy and paste this link into your browser:</p>
    <div class="raw-link">${resetUrl}</div>

    <p style="font-size: 12px; color: #94a3b8;">This reset link expires in <strong>30 minutes</strong> and can only be used once.</p>

    <div class="notice">
      If you did not request a password reset, no action is required. Your account remains secure.
    </div>
  </div>
  <div class="footer">
    © ${new Date().getFullYear()} bg.tools • High-Precision AI Image Processing<br>
    Support: <a href="mailto:Support@bg.tools" style="color: #64748b;">Support@bg.tools</a>
  </div>
</body>
</html>
`.trim();

    return this.sendMail({
      to: recipient,
      subject,
      text: textContent,
      html: htmlContent,
      metadata: { resetUrl },
    });
  },

  /**
   * Internal generic mail dispatcher with error sanitization & mock support
   */
  async sendMail(params: {
    to: string;
    subject: string;
    text: string;
    html: string;
    metadata?: { otp?: string; resetUrl?: string };
  }): Promise<SendEmailResult> {
    const config = getSmtpConfig();
    const { transporter, isMock } = getTransporter();

    if (isMock) {
      mockEmailOutbox.push({
        to: params.to,
        subject: params.subject,
        otp: params.metadata?.otp,
        resetUrl: params.metadata?.resetUrl,
        sentAt: new Date().toISOString(),
      });
      console.log(
        `[Hostinger Mock Mailer] Email queued for ${params.to} | Subject: "${params.subject}"`
      );
      return { success: true, messageId: `mock_${Date.now()}` };
    }

    if (!transporter) {
      console.error("[Hostinger Mailer Error] Transporter unavailable.");
      return { success: false, error: "Email delivery service unavailable." };
    }

    try {
      const info = await transporter.sendMail({
        from: config.from,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      // Do NOT log message body or expose SMTP passwords
      console.error(
        `[Hostinger SMTP Delivery Error] Failed sending to ${params.to}:`,
        err?.message || "Unknown SMTP error"
      );
      return {
        success: false,
        error: "Unable to send email at this time. Please try again shortly.",
      };
    }
  },
};
