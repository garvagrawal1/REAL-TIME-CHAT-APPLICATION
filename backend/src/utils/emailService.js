const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transporter.
 * Supports SMTP configuration via environment variables.
 * Falls back to console output if SMTP credentials are not configured.
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = process.env.SMTP_PORT || process.env.EMAIL_PORT || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: Number(port),
      secure: Number(port) === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  return null;
};

/**
 * Send 6-digit OTP email with an attractive, modern responsive HTML template
 * @param {string} email - Destination email address
 * @param {string} name - User's name
 * @param {string} otp - 6-digit verification code
 */
const sendVerificationOtp = async (email, name, otp) => {
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@chatflow.ai';
  const transporter = createTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification Code - ChatFlow AI</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #090d16;
          color: #f1f5f9;
          margin: 0;
          padding: 24px;
        }
        .container {
          max-width: 520px;
          margin: 0 auto;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }
        .header {
          padding: 32px 24px 20px;
          text-align: center;
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(168, 85, 247, 0.1));
          border-bottom: 1px solid #1e293b;
        }
        .brand {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 22px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
        }
        .content {
          padding: 32px 28px;
          text-align: center;
        }
        h2 {
          font-size: 20px;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 12px;
          color: #f8fafc;
        }
        p {
          font-size: 14px;
          line-height: 1.6;
          color: #94a3b8;
          margin: 0 0 24px;
        }
        .otp-badge {
          display: inline-block;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: 8px;
          color: #818cf8;
          background: #1e1b4b;
          border: 2px dashed #4f46e5;
          padding: 16px 32px;
          border-radius: 16px;
          margin: 8px 0 24px;
          font-family: 'Courier New', Courier, monospace;
        }
        .footer {
          padding: 20px 24px;
          text-align: center;
          font-size: 12px;
          color: #64748b;
          background: #090d16;
          border-top: 1px solid #1e293b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">
            ✨ ChatFlow AI
          </div>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Hello <strong>${name || 'there'}</strong>,</p>
          <p>Thank you for joining ChatFlow AI! Use the 6-digit verification code below to verify your email address. This code is valid for <strong>10 minutes</strong>.</p>
          
          <div class="otp-badge">${otp}</div>
          
          <p style="font-size: 12px; color: #64748b;">If you did not request this verification code, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ChatFlow AI Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"ChatFlow AI" <${fromEmail}>`,
        to: email,
        subject: `Your ChatFlow AI Verification Code: ${otp}`,
        text: `Your ChatFlow AI email verification code is: ${otp}. This code expires in 10 minutes.`,
        html: htmlContent,
      });
      console.log(`[Email Service] Verification OTP sent to ${email} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[Email Service Error] Failed to send email to ${email}:`, err.message);
      // Even if SMTP fails, return OTP in dev for resilience
      return { success: false, error: err.message, devOtp: otp };
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`[DEV EMAIL SIMULATION] Verification OTP for ${email}:`);
    console.log(`👉 OTP CODE: >>> ${otp} <<< (Valid for 10 minutes)`);
    console.log(`To send real emails, set SMTP_USER and SMTP_PASS in backend/.env`);
    console.log(`======================================================\n`);
    return { success: true, isSimulated: true, devOtp: otp };
  }
};

module.exports = {
  sendVerificationOtp,
};
