import { mailer } from "../src/lib/email/mailer";

async function testSmtp() {
  console.log("==================================================");
  console.log("Testing Hostinger SMTP Connection for bg.tools");
  console.log("==================================================");

  console.log(`SMTP_HOST: ${process.env["SMTP_HOST"] || "smtp.hostinger.com"}`);
  console.log(`SMTP_PORT: ${process.env["SMTP_PORT"] || "465"}`);
  console.log(`SMTP_USER: ${process.env["SMTP_USER"] || "noreply@bg.tools"}`);
  console.log(`SMTP_PASS set: ${process.env["SMTP_PASS"] ? "Yes (hidden)" : "No (Empty)"}`);

  if (!process.env["SMTP_PASS"]) {
    console.log(
      "\n[Notice] SMTP_PASS is currently empty in .env. Real connection check skipped. To test live delivery, set SMTP_PASS in .env and run this script again."
    );
    return;
  }

  const result = await mailer.verifyConnection();
  if (result.success) {
    console.log("\n✅ Hostinger SMTP connection verified successfully! Ready for live email delivery.");
  } else {
    console.error("\n❌ Hostinger SMTP connection failed:", result.error);
  }
}

testSmtp().catch(console.error);
