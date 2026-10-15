import fs from "fs";
import path from "path";

// Test script to preview the White & Orange email template with Mandala background
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

const encodedSvg = Buffer.from(mandalaSvg).toString("base64");
const mandalaDataUri = `data:image/svg+xml;base64,${encodedSvg}`;

const logoPath = path.join(process.cwd(), "public", "images", "logo.png");
const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath).toString("base64") : "";
const logoDataUri = logoBase64 ? `data:image/png;base64,${logoBase64}` : "/images/logo.png";

const previewHtml = `<!DOCTYPE html>
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
      position: relative;
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
    /* LATEST OFFER SECTION */
    .offer-box {
      background: linear-gradient(135deg, #FFF8F0 0%, #FFF0DE 100%);
      border: 1.5px solid #FFCCA0;
      border-radius: 20px;
      padding: 24px;
      margin-top: 10px;
      position: relative;
    }
    .offer-badge {
      display: inline-block;
      background: linear-gradient(90deg, #FF7A00, #FF4500);
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 9999px;
      box-shadow: 0 2px 6px rgba(255, 69, 0, 0.25);
    }
    .offer-title {
      font-size: 18px;
      font-weight: 900;
      color: #000000;
      margin: 12px 0 6px 0;
    }
    .offer-subtitle {
      font-size: 13px;
      color: #374151;
      line-height: 1.5;
      margin: 0 0 14px 0;
    }
    .offer-price-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 16px;
    }
    .offer-price {
      font-size: 28px;
      font-weight: 900;
      color: #FF5500;
    }
    .offer-original-price {
      font-size: 15px;
      font-weight: 600;
      color: #9CA3AF;
      text-decoration: line-through;
    }
    .offer-features {
      list-style: none;
      padding: 0;
      margin: 0 0 18px 0;
    }
    .offer-features li {
      font-size: 12px;
      font-weight: 600;
      color: #1F2937;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .offer-button {
      display: block;
      width: 100%;
      box-sizing: border-box;
      background: linear-gradient(90deg, #FF6B00 0%, #FF4500 100%);
      color: #FFFFFF !important;
      text-align: center;
      text-decoration: none;
      font-size: 14px;
      font-weight: 800;
      padding: 13px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(255, 107, 0, 0.35);
      letter-spacing: 0.2px;
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
        <!-- Logo -->
        <a href="https://bg.tools" target="_blank" class="brand-logo" style="text-decoration: none; display: inline-block;">
          <img src="${logoDataUri}" alt="bg." width="48" height="48" style="display: block; border: 0; outline: none; text-decoration: none; width: 48px; height: 48px; border-radius: 12px;" />
        </a>
        
        <div>
          <span class="badge-pill">EMAIL VERIFICATION</span>
        </div>

        <h1 class="main-title">Verify Your Account</h1>
        <p class="greeting-text">Hi Ravi,</p>
        <p class="body-paragraph">
          Thank you for choosing <strong>bg.tools</strong>. Use the six-digit verification code below to complete your registration and activate your <strong>10 free daily Bronze Tokens</strong>.
        </p>

        <!-- OTP Code Box -->
        <div class="otp-box">
          <div class="otp-digits">607573</div>
          <div class="otp-expiry">VALID FOR 10 MINUTES • SINGLE USE ONLY</div>
        </div>

        <p class="security-callout">
          Never share this code with anyone. Our support team will never ask for your verification code.
        </p>

        <p class="disclaimer-text">
          If you did not request this verification email, someone may have entered your email address by mistake. You can safely disregard this message.
        </p>

        <!-- LATEST OFFER SECTION -->
        <div class="offer-box">
          <span class="offer-badge">🎉 FESTIVAL MEGA OFFER • 60% OFF</span>
          <div class="offer-title">Festive Creator Pack (650 Total Credits)</div>
          <div class="offer-subtitle">
            Get 500 Credits + <strong>150 Extra Bonus Credits</strong> today. Permanent credits that never expire!
          </div>
          <div class="offer-price-row">
            <span class="offer-price">₹999</span>
            <span class="offer-original-price">₹2,499</span>
          </div>
          <ul class="offer-features">
            <li>✨ 650 Total Credits — Lifetime validity (Never expire)</li>
            <li>🚀 Ultra HD 4K outputs across all 30+ tools</li>
            <li>⚡ Instant dedicated high-speed processing engine</li>
          </ul>
          <a href="https://bg.tools/pricing" class="offer-button">
            Claim Offer on bg.tools →
          </a>
        </div>

      </div>
    </div>

    <!-- Outer Footer -->
    <div class="footer-section">
      © 2026 <strong>bg.tools</strong> • High-Precision AI Image Processing & Creative Suite<br>
      Questions? Contact us at <a href="mailto:Support@bg.tools">Support@bg.tools</a><br>
      <a href="https://bg.tools/privacy">Privacy Policy</a> • <a href="https://bg.tools/terms">Terms of Service</a>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(process.cwd(), "public", "email_preview.html"), previewHtml);
console.log("Written preview to public/email_preview.html");
