import nodemailer, { type Transporter } from "nodemailer";
import fs from "fs";
import path from "path";

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
 * Geometric sacred Mandala watermark vector pattern
 */
function getMandalaDataUri(): string {
  const mandalaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <g fill="none" stroke="#FF7A00" stroke-width="1.3" opacity="0.13">
    <circle cx="300" cy="300" r="22"/>
    <circle cx="300" cy="300" r="48" stroke-dasharray="3,3"/>
    <circle cx="300" cy="300" r="78"/>
    <circle cx="300" cy="300" r="114"/>
    <circle cx="300" cy="300" r="154" stroke-dasharray="4,4"/>
    <circle cx="300" cy="300" r="198"/>
    <circle cx="300" cy="300" r="248" stroke-dasharray="5,5"/>
    <circle cx="300" cy="300" r="288"/>
    <path d="M300,225 C315,255 315,275 300,300 C285,275 285,255 300,225 Z"/>
    <path d="M300,225 C315,255 315,275 300,300 C285,275 285,255 300,225 Z" transform="rotate(30 300 300)"/>
    <path d="M300,225 C315,255 315,275 300,300 C285,275 285,255 300,225 Z" transform="rotate(60 300 300)"/>
    <path d="M300,225 C315,255 315,275 300,300 C285,275 285,255 300,225 Z" transform="rotate(90 300 300)"/>
    <path d="M300,225 C315,255 315,275 300,300 C285,275 285,255 300,225 Z" transform="rotate(120 300 300)"/>
    <path d="M300,225 C315,255 315,275 300,300 C285,275 285,255 300,225 Z" transform="rotate(150 300 300)"/>
    <path d="M300,225 C315,255 315,275 300,300 C285,275 285,255 300,225 Z" transform="rotate(180 300 300)"/>
    <path d="M300,225 C315,255 315,275 300,300 C285,275 285,255 300,225 Z" transform="rotate(210 300 300)"/>
    <path d="M300,225 C315,255 315,275 300,300 C285,275 285,255 300,225 Z" transform="rotate(240 300 300)"/>
    <path d="M300,225 C315,255 315,275 300,300 C285,275 285,255 300,225 Z" transform="rotate(270 300 300)"/>
    <path d="M300,225 C315,255 315,275 300,300 C285,275 285,255 300,225 Z" transform="rotate(300 300 300)"/>
    <path d="M300,225 C315,255 315,275 300,300 C285,275 285,255 300,225 Z" transform="rotate(330 300 300)"/>
    <path d="M300,105 C330,150 330,200 300,250 C270,200 270,150 300,105 Z"/>
    <path d="M300,105 C330,150 330,200 300,250 C270,200 270,150 300,105 Z" transform="rotate(30 300 300)"/>
    <path d="M300,105 C330,150 330,200 300,250 C270,200 270,150 300,105 Z" transform="rotate(60 300 300)"/>
    <path d="M300,105 C330,150 330,200 300,250 C270,200 270,150 300,105 Z" transform="rotate(90 300 300)"/>
    <path d="M300,105 C330,150 330,200 300,250 C270,200 270,150 300,105 Z" transform="rotate(120 300 300)"/>
    <path d="M300,105 C330,150 330,200 300,250 C270,200 270,150 300,105 Z" transform="rotate(150 300 300)"/>
    <path d="M300,105 C330,150 330,200 300,250 C270,200 270,150 300,105 Z" transform="rotate(180 300 300)"/>
    <path d="M300,105 C330,150 330,200 300,250 C270,200 270,150 300,105 Z" transform="rotate(210 300 300)"/>
    <path d="M300,105 C330,150 330,200 300,250 C270,200 270,150 300,105 Z" transform="rotate(240 300 300)"/>
    <path d="M300,105 C330,150 330,200 300,250 C270,200 270,150 300,105 Z" transform="rotate(270 300 300)"/>
    <path d="M300,105 C330,150 330,200 300,250 C270,200 270,150 300,105 Z" transform="rotate(300 300 300)"/>
    <path d="M300,105 C330,150 330,200 300,250 C270,200 270,150 300,105 Z" transform="rotate(330 300 300)"/>
    <polygon points="300,55 320,110 300,135 280,110"/>
    <polygon points="300,55 320,110 300,135 280,110" transform="rotate(30 300 300)"/>
    <polygon points="300,55 320,110 300,135 280,110" transform="rotate(60 300 300)"/>
    <polygon points="300,55 320,110 300,135 280,110" transform="rotate(90 300 300)"/>
    <polygon points="300,55 320,110 300,135 280,110" transform="rotate(120 300 300)"/>
    <polygon points="300,55 320,110 300,135 280,110" transform="rotate(150 300 300)"/>
    <polygon points="300,55 320,110 300,135 280,110" transform="rotate(180 300 300)"/>
    <polygon points="300,55 320,110 300,135 280,110" transform="rotate(210 300 300)"/>
    <polygon points="300,55 320,110 300,135 280,110" transform="rotate(240 300 300)"/>
    <polygon points="300,55 320,110 300,135 280,110" transform="rotate(270 300 300)"/>
    <polygon points="300,55 320,110 300,135 280,110" transform="rotate(300 300 300)"/>
    <polygon points="300,55 320,110 300,135 280,110" transform="rotate(330 300 300)"/>
  </g>
</svg>`;
  const base64 = Buffer.from(mandalaSvg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Locates the official logo.png on disk for inline CID attachment
 */
function getLogoAttachment(): {
  filename: string;
  path: string;
  cid: string;
  contentDisposition: "inline";
} | null {
  const possiblePaths = [
    path.join(process.cwd(), "public", "images", "logo.png"),
    path.join(process.cwd(), "public", "logo.png"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return {
        filename: "logo.png",
        path: p,
        cid: "bgtoolslogo",
        contentDisposition: "inline",
      };
    }
  }
  return null;
}

function getLogoInfo(appBaseUrl: string): { src: string } {
  const attachment = getLogoAttachment();
  return {
    src: attachment ? "cid:bgtoolslogo" : `${appBaseUrl}/images/logo.png`,
  };
}

/**
 * Promotional Festive / Latest Offer Box for all transactional emails
 */
function getLatestOfferHtml(appBaseUrl: string): string {
  return `
    <div style="background: linear-gradient(135deg, #FFF8F0 0%, #FFF0DE 100%); border: 1.5px solid #FFCCA0; border-radius: 20px; padding: 24px; margin-top: 10px; text-align: left;">
      <span style="display: inline-block; background: linear-gradient(90deg, #FF7A00, #FF4500); color: #FFFFFF; font-size: 11px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; box-shadow: 0 2px 6px rgba(255, 69, 0, 0.25);">
        🎉 FESTIVAL MEGA OFFER • 60% OFF
      </span>
      <div style="font-size: 18px; font-weight: 900; color: #000000; margin: 12px 0 6px 0;">
        Festive Creator Pack (650 Total Credits)
      </div>
      <div style="font-size: 13px; color: #374151; line-height: 1.5; margin: 0 0 14px 0;">
        Get 500 Credits + <strong style="color: #000000;">150 Extra Bonus Credits</strong> today. Permanent credits that never expire!
      </div>
      <div style="margin: 0 0 14px 0;">
        <span style="font-size: 28px; font-weight: 900; color: #FF5500;">₹999</span>
        <span style="font-size: 15px; font-weight: 600; color: #9CA3AF; text-decoration: line-through; margin-left: 8px;">₹2,499</span>
        <span style="display: inline-block; background-color: #DEF7EC; color: #03543F; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px; margin-left: 6px;">SAVE ₹1,500</span>
      </div>
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 16px;">
        <tr><td style="font-size: 12px; font-weight: 700; color: #1F2937; padding: 3px 0;">✓ 650 Total Credits — Lifetime validity (Never expire)</td></tr>
        <tr><td style="font-size: 12px; font-weight: 700; color: #1F2937; padding: 3px 0;">✓ Ultra HD 4K outputs across all 30+ tools</td></tr>
        <tr><td style="font-size: 12px; font-weight: 700; color: #1F2937; padding: 3px 0;">✓ Instant dedicated high-speed processing engine</td></tr>
      </table>
      <a href="${appBaseUrl}/pricing" style="display: block; box-sizing: border-box; background: linear-gradient(90deg, #FF6B00 0%, #FF4500 100%); color: #FFFFFF !important; text-align: center; text-decoration: none; font-size: 14px; font-weight: 800; padding: 13px 20px; border-radius: 12px; box-shadow: 0 4px 14px rgba(255, 107, 0, 0.35); letter-spacing: 0.2px;">
        Claim Offer on bg.tools →
      </a>
    </div>
  `;
}

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
   * Designed with White & Orange aesthetic, high-contrast Black text,
   * subtle geometric Mandala watermark background, and Latest Offer card at bottom.
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
    const mandalaDataUri = getMandalaDataUri();
    const latestOfferHtml = getLatestOfferHtml(config.appBaseUrl);
    const logoInfo = getLogoInfo(config.appBaseUrl);

    const textContent = `
Hello ${displayName},

Welcome to bg.tools!

Your single-use six-digit verification code is:
${params.otp}

This verification code expires in 10 minutes and can only be used once.

Never share this code with anyone. Our support team will never ask for your verification code.

If you did not request this verification code, please ignore this email.

--------------------------------------------------
🎉 LATEST FESTIVAL SPECIAL OFFER:
Creator Mega Pack (650 Total Credits)
Now ₹999 (Regular ₹2,499 • 60% OFF)
Includes 150 Free Extra Bonus Credits with lifetime validity (never expires).
Claim offer at: ${config.appBaseUrl}/pricing
--------------------------------------------------

Best regards,
The bg.tools Team
${config.appBaseUrl}
`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your bg.tools Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F8F9FA;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #000000;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    .wrapper {
      width: 100%;
      background-color: #F8F9FA;
      padding: 40px 15px;
    }
    .card-container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #FFE2CA;
      border-radius: 24px;
      box-shadow: 0 12px 36px rgba(255, 122, 0, 0.08);
      overflow: hidden;
      background-image: url('${mandalaDataUri}');
      background-repeat: no-repeat;
      background-position: top 30px center;
      background-size: 520px 520px;
    }
    .top-accent-bar {
      height: 5px;
      background: linear-gradient(90deg, #FF9900 0%, #FF6B00 50%, #FF4500 100%);
      width: 100%;
    }
    .content-body {
      padding: 40px 36px 36px 36px;
    }
    .brand-logo {
      display: inline-block;
      text-decoration: none;
      line-height: 1;
    }
    .brand-logo img {
      display: block;
      border: 0;
      outline: none;
    }
    .badge-pill {
      display: inline-block;
      background-color: #FFF3E6;
      color: #D95400;
      border: 1px solid #FFD3AC;
      padding: 5px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-top: 20px;
    }
    .main-title {
      font-size: 26px;
      font-weight: 900;
      color: #000000;
      margin: 16px 0 10px 0;
      line-height: 1.25;
      letter-spacing: -0.5px;
    }
    .greeting-text {
      font-size: 16px;
      font-weight: 700;
      color: #000000;
      margin: 0 0 8px 0;
    }
    .body-paragraph {
      font-size: 14px;
      line-height: 1.6;
      color: #1F2937;
      margin: 0 0 24px 0;
    }
    .otp-box {
      background-color: #FFFDF9;
      border: 2px dashed #FF6B00;
      border-radius: 18px;
      padding: 26px 20px;
      text-align: center;
      margin: 28px 0;
      box-shadow: 0 4px 16px rgba(255, 107, 0, 0.05);
    }
    .otp-digits {
      font-family: 'SF Pro Display', 'Courier New', Courier, monospace;
      font-size: 42px;
      font-weight: 900;
      letter-spacing: 12px;
      color: #FF6B00;
      margin: 0;
      line-height: 1.1;
      padding-left: 12px;
    }
    .otp-expiry {
      font-size: 11px;
      color: #8C3700;
      margin-top: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .security-callout {
      font-size: 13px;
      font-weight: 700;
      color: #000000;
      margin: 0 0 8px 0;
      line-height: 1.5;
    }
    .disclaimer-text {
      font-size: 12px;
      color: #4B5563;
      line-height: 1.5;
      margin: 0 0 28px 0;
      padding-bottom: 24px;
      border-bottom: 1px solid #F3F4F6;
    }
    .footer-section {
      text-align: center;
      padding-top: 28px;
      font-size: 12px;
      color: #6B7280;
      line-height: 1.6;
    }
    .footer-section a {
      color: #FF6B00;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card-container">
      <div class="top-accent-bar"></div>
      
      <div class="content-body">
        <a href="${config.appBaseUrl}" target="_blank" class="brand-logo" style="text-decoration: none; display: inline-block;">
          <img src="${logoInfo.src}" alt="bg.tools" width="150" height="44" style="display: block; border: 0; outline: none; text-decoration: none; width: 150px; height: 44px; max-width: 160px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 900; color: #0F172A;" />
        </a>
        
        <div>
          <span class="badge-pill">EMAIL VERIFICATION</span>
        </div>

        <h1 class="main-title">Verify Your Account</h1>
        <p class="greeting-text">Hi ${displayName},</p>
        <p class="body-paragraph">
          Thank you for choosing <strong>bg.tools</strong>. Use the six-digit verification code below to complete your registration and activate your <strong>10 free daily Bronze Tokens</strong>.
        </p>

        <!-- OTP Code Box -->
        <div class="otp-box">
          <div class="otp-digits">${params.otp}</div>
          <div class="otp-expiry">VALID FOR 10 MINUTES • SINGLE USE ONLY</div>
        </div>

        <p class="security-callout">
          Never share this code with anyone. Our support team will never ask for your verification code.
        </p>

        <p class="disclaimer-text">
          If you did not request this verification email, someone may have entered your email address by mistake. You can safely disregard this message.
        </p>

        <!-- LATEST OFFER SECTION -->
        ${latestOfferHtml}
      </div>
    </div>

    <!-- Outer Footer -->
    <div class="footer-section">
      © ${new Date().getFullYear()} <strong>bg.tools</strong> • High-Precision AI Image Processing & Creative Suite<br>
      Questions? Contact us at <a href="mailto:Support@bg.tools">Support@bg.tools</a><br>
      <a href="${config.appBaseUrl}/privacy">Privacy Policy</a> • <a href="${config.appBaseUrl}/terms">Terms of Service</a>
    </div>
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
   * Designed with White & Orange aesthetic, high-contrast Black text,
   * subtle geometric Mandala watermark background, and Latest Offer card at bottom.
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
    const mandalaDataUri = getMandalaDataUri();
    const latestOfferHtml = getLatestOfferHtml(config.appBaseUrl);
    const logoInfo = getLogoInfo(config.appBaseUrl);

    const textContent = `
Hello ${displayName},

We received a request to reset the password for your bg.tools account.

To set a new password, open the link below in your browser:
${resetUrl}

This link is valid for 30 minutes and can only be used once.

If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.

--------------------------------------------------
🎉 LATEST FESTIVAL SPECIAL OFFER:
Creator Mega Pack (650 Total Credits)
Now ₹999 (Regular ₹2,499 • 60% OFF)
Includes 150 Free Extra Bonus Credits with lifetime validity (never expires).
Claim offer at: ${config.appBaseUrl}/pricing
--------------------------------------------------

Best regards,
The bg.tools Team
${config.appBaseUrl}
`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your bg.tools Password</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F8F9FA;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #000000;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    .wrapper {
      width: 100%;
      background-color: #F8F9FA;
      padding: 40px 15px;
    }
    .card-container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #FFE2CA;
      border-radius: 24px;
      box-shadow: 0 12px 36px rgba(255, 122, 0, 0.08);
      overflow: hidden;
      background-image: url('${mandalaDataUri}');
      background-repeat: no-repeat;
      background-position: top 30px center;
      background-size: 520px 520px;
    }
    .top-accent-bar {
      height: 5px;
      background: linear-gradient(90deg, #FF9900 0%, #FF6B00 50%, #FF4500 100%);
      width: 100%;
    }
    .content-body {
      padding: 40px 36px 36px 36px;
    }
    .brand-logo {
      display: inline-block;
      text-decoration: none;
      line-height: 1;
    }
    .brand-logo img {
      display: block;
      border: 0;
      outline: none;
    }
    .badge-pill {
      display: inline-block;
      background-color: #FFF3E6;
      color: #D95400;
      border: 1px solid #FFD3AC;
      padding: 5px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-top: 20px;
    }
    .main-title {
      font-size: 26px;
      font-weight: 900;
      color: #000000;
      margin: 16px 0 10px 0;
      line-height: 1.25;
      letter-spacing: -0.5px;
    }
    .greeting-text {
      font-size: 16px;
      font-weight: 700;
      color: #000000;
      margin: 0 0 8px 0;
    }
    .body-paragraph {
      font-size: 14px;
      line-height: 1.6;
      color: #1F2937;
      margin: 0 0 24px 0;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0;
    }
    .btn-reset {
      display: inline-block;
      background: linear-gradient(90deg, #FF6B00 0%, #FF4500 100%);
      color: #FFFFFF !important;
      font-weight: 800;
      font-size: 15px;
      text-decoration: none;
      padding: 14px 34px;
      border-radius: 9999px;
      box-shadow: 0 4px 14px rgba(255, 107, 0, 0.35);
      letter-spacing: 0.2px;
    }
    .raw-link {
      word-break: break-all;
      font-size: 12px;
      color: #D95400;
      background-color: #FFF8F2;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid #FFE2CA;
      margin: 16px 0;
      line-height: 1.5;
    }
    .disclaimer-text {
      font-size: 12px;
      color: #4B5563;
      line-height: 1.5;
      margin: 0 0 28px 0;
      padding-bottom: 24px;
      border-bottom: 1px solid #F3F4F6;
    }
    .footer-section {
      text-align: center;
      padding-top: 28px;
      font-size: 12px;
      color: #6B7280;
      line-height: 1.6;
    }
    .footer-section a {
      color: #FF6B00;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card-container">
      <div class="top-accent-bar"></div>
      
      <div class="content-body">
        <a href="${config.appBaseUrl}" target="_blank" class="brand-logo" style="text-decoration: none; display: inline-block;">
          <img src="${logoInfo.src}" alt="bg.tools" width="150" height="44" style="display: block; border: 0; outline: none; text-decoration: none; width: 150px; height: 44px; max-width: 160px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 900; color: #0F172A;" />
        </a>
        
        <div>
          <span class="badge-pill">PASSWORD ASSISTANCE</span>
        </div>

        <h1 class="main-title">Reset Your Password</h1>
        <p class="greeting-text">Hi ${displayName},</p>
        <p class="body-paragraph">
          We received a request to reset your password. Click the secure button below to set a new password for your <strong>bg.tools</strong> account.
        </p>

        <div class="btn-container">
          <a href="${resetUrl}" class="btn-reset">Reset Password →</a>
        </div>

        <p style="font-size: 13px; font-weight: 600; color: #000000; margin: 16px 0 6px 0;">
          Or copy and paste this link into your browser:
        </p>
        <div class="raw-link">${resetUrl}</div>

        <p class="disclaimer-text">
          This reset link expires in <strong>30 minutes</strong> and can only be used once. If you did not request a password reset, you can safely ignore this email.
        </p>

        <!-- LATEST OFFER SECTION -->
        ${latestOfferHtml}
      </div>
    </div>

    <!-- Outer Footer -->
    <div class="footer-section">
      © ${new Date().getFullYear()} <strong>bg.tools</strong> • High-Precision AI Image Processing & Creative Suite<br>
      Questions? Contact us at <a href="mailto:Support@bg.tools">Support@bg.tools</a><br>
      <a href="${config.appBaseUrl}/privacy">Privacy Policy</a> • <a href="${config.appBaseUrl}/terms">Terms of Service</a>
    </div>
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

    const logoAttachment = getLogoAttachment();
    const attachments = logoAttachment ? [logoAttachment] : [];

    try {
      const info = await transporter.sendMail({
        from: config.from,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
        attachments,
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
