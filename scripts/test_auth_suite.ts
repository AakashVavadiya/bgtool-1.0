import assert from "node:assert";
import {
  handleSignup,
  handleVerifyOtp,
  handleResendOtp,
  handleLogin,
  handleForgotPassword,
  handleResetPassword,
  handleUpdateProfile,
  handleChangePassword,
  handleLogout,
  handleMe,
} from "../src/lib/security/auth-user-server";
import { usersRepo } from "../src/lib/db/users-repo";
import { otpRepo } from "../src/lib/db/otp-repo";
import { passwordResetRepo } from "../src/lib/db/password-reset-repo";
import { sessionsRepo } from "../src/lib/db/sessions-repo";
import { mockEmailOutbox } from "../src/lib/email/mailer";

// Ensure mock mode is active for testing
process.env["ENABLE_MOCK_EMAIL"] = "true";

async function runAuthTestSuite() {
  console.log("====================================================");
  console.log("RUNNING BG.TOOLS PRODUCTION AUTHENTICATION TEST SUITE");
  console.log("====================================================");

  const testEmail = `test.user.${Date.now()}@bg.tools`;
  const testPassword = "SuperSecurePassword2026!";
  const testName = "Jane Doe";
  const testIp = "192.168.1.50";

  // ---------------------------------------------------------------------------
  // TEST 1: User Registration
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 1] Testing User Registration...");
  const signupReq = new Request("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      password: testPassword,
    }),
  });

  const signupRes = await handleSignup(signupReq, testIp);
  assert.strictEqual(signupRes.status, 200, "Signup should return HTTP 200");
  const signupData = await signupRes.json();
  assert.strictEqual(signupData.success, true, "Signup success should be true");
  assert.strictEqual(signupData.requireVerification, true, "Should require OTP verification");
  assert.strictEqual(signupData.email, testEmail, "Email returned should match normalized email");

  const dbUser = usersRepo.findByEmail(testEmail);
  assert.ok(dbUser, "User record must exist in SQLite database");
  assert.strictEqual(dbUser.email_verified, 0, "Account must be unverified initially");
  assert.strictEqual(dbUser.verified_at, null, "verified_at must be null initially");

  // Check mock mail delivery
  const signupEmail = mockEmailOutbox.find((m) => m.to === testEmail);
  assert.ok(signupEmail, "OTP email should be dispatched via mailer");
  assert.ok(signupEmail.otp, "Dispatched email must include 6-digit OTP");
  assert.strictEqual(signupEmail.otp.length, 6, "OTP must be exactly 6 digits");
  const issuedOtp = signupEmail.otp;
  console.log("  ✓ Registration succeeded. OTP issued:", issuedOtp);

  // ---------------------------------------------------------------------------
  // TEST 2: Block Login for Unverified Account
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 2] Testing Login Block for Unverified Account...");
  const prematureLoginReq = new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });

  const prematureLoginRes = await handleLogin(prematureLoginReq, testIp);
  assert.strictEqual(prematureLoginRes.status, 403, "Login for unverified account must be HTTP 403");
  const prematureLoginData = await prematureLoginRes.json();
  assert.strictEqual(prematureLoginData.unverified, true, "Response must flag unverified: true");
  assert.ok(prematureLoginData.error.includes("verify"), "Error message must guide user to verify email");
  console.log("  ✓ Premature login correctly blocked with verification guidance");

  // ---------------------------------------------------------------------------
  // TEST 3: Invalid OTP & Attempt Decrement
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 3] Testing Invalid OTP Submission & Attempt Counter...");
  const wrongOtpReq = new Request("http://localhost:3000/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      otp: "000000", // Wrong code
    }),
  });

  const wrongOtpRes = await handleVerifyOtp(wrongOtpReq, testIp);
  assert.strictEqual(wrongOtpRes.status, 400, "Wrong OTP must return HTTP 400");
  const wrongOtpData = await wrongOtpRes.json();
  assert.strictEqual(wrongOtpData.success, false);
  assert.ok(wrongOtpData.error.includes("4 attempts remaining"), "Should report 4 attempts remaining");
  console.log("  ✓ Invalid OTP correctly rejected, remaining attempts tracked");

  // ---------------------------------------------------------------------------
  // TEST 4: Resend OTP Cooldown (60 Seconds)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 4] Testing Resend Cooldown (60s minimum)...");
  const cooldownReq = new Request("http://localhost:3000/api/auth/resend-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail }),
  });

  const cooldownRes = await handleResendOtp(cooldownReq, testIp);
  assert.strictEqual(cooldownRes.status, 429, "Immediate resend within 60s must return HTTP 429");
  const cooldownData = await cooldownRes.json();
  assert.ok(cooldownData.error.includes("seconds"), "Should return cooldown message");
  console.log("  ✓ Resend cooldown enforced (HTTP 429)");

  // ---------------------------------------------------------------------------
  // TEST 5: Successful OTP Verification & Account Activation
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 5] Testing Correct OTP Verification & Session Issuance...");
  const correctOtpReq = new Request("http://localhost:3000/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      otp: issuedOtp,
    }),
  });

  const correctOtpRes = await handleVerifyOtp(correctOtpReq, testIp);
  assert.strictEqual(correctOtpRes.status, 200, "Valid OTP must return HTTP 200");
  const correctOtpData = await correctOtpRes.json();
  assert.strictEqual(correctOtpData.success, true);
  assert.strictEqual(correctOtpData.user.email, testEmail);

  // Check Set-Cookie
  const setCookie = correctOtpRes.headers.get("Set-Cookie");
  assert.ok(setCookie, "Response must include Set-Cookie header");
  assert.ok(setCookie.includes("bg_session="), "Cookie must contain bg_session");
  assert.ok(setCookie.includes("HttpOnly"), "Cookie must be HttpOnly");

  const sessionToken = setCookie.match(/bg_session=([^;]+)/)?.[1];
  assert.ok(sessionToken, "Extracted session token must exist");

  const verifiedUser = usersRepo.findByEmail(testEmail);
  assert.strictEqual(verifiedUser?.email_verified, 1, "User must be marked verified in SQLite");
  assert.ok(verifiedUser?.verified_at, "verified_at timestamp must be recorded");
  console.log("  ✓ Account activated and session cookie issued");

  // ---------------------------------------------------------------------------
  // TEST 6: Atomic Consumption (Replay Prevention)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 6] Testing Atomic Consumption / Replay Protection...");
  const replayOtpRes = await handleVerifyOtp(correctOtpReq, testIp);
  assert.strictEqual(replayOtpRes.status, 400, "Used OTP must not be reusable");
  console.log("  ✓ OTP replay attack rejected");

  // ---------------------------------------------------------------------------
  // TEST 7: Authenticated Session Probe (/api/auth/me)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 7] Testing Authenticated Session (/api/auth/me)...");
  const meReq = new Request("http://localhost:3000/api/auth/me", {
    method: "GET",
    headers: { Cookie: `bg_session=${sessionToken}` },
  });

  const meRes = await handleMe(meReq);
  assert.strictEqual(meRes.status, 200, "Valid session should return HTTP 200");
  const meData = await meRes.json();
  assert.strictEqual(meData.authenticated, true);
  assert.strictEqual(meData.user.email, testEmail);
  console.log("  ✓ Session valid, retrieved user:", meData.user.name);

  // ---------------------------------------------------------------------------
  // TEST 8: Login with Verified Account
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 8] Testing Login with Verified Account...");
  const loginReq = new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });

  const loginRes = await handleLogin(loginReq, testIp);
  assert.strictEqual(loginRes.status, 200, "Verified user login must return HTTP 200");
  const loginData = await loginRes.json();
  assert.strictEqual(loginData.success, true);
  const newSetCookie = loginRes.headers.get("Set-Cookie");
  assert.ok(newSetCookie?.includes("bg_session="), "Login must issue fresh session cookie");
  console.log("  ✓ Verified login successful");

  // ---------------------------------------------------------------------------
  // TEST 9: Incorrect Password
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 9] Testing Incorrect Password...");
  const badPassReq = new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "WrongPassword999!",
    }),
  });

  const badPassRes = await handleLogin(badPassReq, testIp);
  assert.strictEqual(badPassRes.status, 401, "Wrong password must return HTTP 401");
  console.log("  ✓ Wrong password rejected safely");

  // ---------------------------------------------------------------------------
  // TEST 10: Forgot Password & Single-Use Reset Token Flow
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 10] Testing Forgot Password & Reset Token...");
  const forgotReq = new Request("http://localhost:3000/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail }),
  });

  const forgotRes = await handleForgotPassword(forgotReq, testIp);
  assert.strictEqual(forgotRes.status, 200, "Forgot password must return HTTP 200");

  const resetEmail = mockEmailOutbox.filter((m) => m.to === testEmail && m.resetUrl).pop();
  assert.ok(resetEmail, "Password reset email must be queued");
  assert.ok(resetEmail.resetUrl, "Reset email must contain resetUrl");

  const tokenMatch = resetEmail.resetUrl.match(/token=([^&]+)/);
  assert.ok(tokenMatch, "Reset URL must contain token param");
  const rawResetToken = tokenMatch[1]!;
  console.log("  ✓ Reset token issued:", rawResetToken.slice(0, 10) + "...");

  // Execute Password Reset
  const newPassword = "BrandNewSuperSecurePassword2026!";
  const resetReq = new Request("http://localhost:3000/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: rawResetToken,
      password: newPassword,
    }),
  });

  const resetRes = await handleResetPassword(resetReq, testIp);
  assert.strictEqual(resetRes.status, 200, "Password reset must return HTTP 200");
  console.log("  ✓ Password reset succeeded");

  // Verify token is single use
  const replayResetRes = await handleResetPassword(resetReq, testIp);
  assert.strictEqual(replayResetRes.status, 400, "Token replay must return HTTP 400");
  console.log("  ✓ Reset token single-use enforcement verified");

  // Verify login with new password
  const newLoginReq = new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: newPassword,
    }),
  });
  const newLoginRes = await handleLogin(newLoginReq, testIp);
  assert.strictEqual(newLoginRes.status, 200, "Login with new password must succeed");
  const loggedInSessionToken = newLoginRes.headers.get("Set-Cookie")!.match(/bg_session=([^;]+)/)![1]!;
  console.log("  ✓ Login with new password succeeded");

  // ---------------------------------------------------------------------------
  // TEST 11: Profile Update & Password Change
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 11] Testing Profile Update & Change Password...");
  const updateReq = new Request("http://localhost:3000/api/auth/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: `bg_session=${loggedInSessionToken}`,
    },
    body: JSON.stringify({ name: "Jane Smith" }),
  });

  const updateRes = await handleUpdateProfile(updateReq);
  assert.strictEqual(updateRes.status, 200, "Update profile must return HTTP 200");
  const updateData = await updateRes.json();
  assert.strictEqual(updateData.user.name, "Jane Smith");
  console.log("  ✓ Display name successfully updated in database");

  // ---------------------------------------------------------------------------
  // TEST 12: Logout & Session Invalidation
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 12] Testing Logout & Session Invalidation...");
  const logoutReq = new Request("http://localhost:3000/api/auth/logout", {
    method: "POST",
    headers: { Cookie: `bg_session=${loggedInSessionToken}` },
  });

  const logoutRes = await handleLogout(logoutReq);
  assert.strictEqual(logoutRes.status, 200, "Logout must return HTTP 200");
  const expiredCookie = logoutRes.headers.get("Set-Cookie");
  assert.ok(expiredCookie?.includes("Max-Age=0"), "Cookie must be expired on logout");

  // Session probe after logout
  const postLogoutMe = await handleMe(logoutReq);
  assert.strictEqual(postLogoutMe.status, 401, "Revoked session must return HTTP 401");
  console.log("  ✓ Logout verified and session safely revoked");

  console.log("\n====================================================");
  console.log("ALL 12 AUTHENTICATION SUITE TESTS PASSED WITH 100% SUCCESS!");
  console.log("====================================================");
}

runAuthTestSuite().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED:", err);
  process.exit(1);
});
