/**
 * Sends a beautifully branded password reset email using Brevo HTTP API.
 * @param {string} toEmail  - Recipient email address
 * @param {string} resetUrl - Full URL with token e.g. https://contestify.vercel.app/reset-password?token=xxx
 */
const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Reset Your Password — Contestify</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="100%" style="max-width:500px;background:#111111;border-radius:24px;border:1px solid #262626;overflow:hidden;">
            
            <!-- Header gradient banner -->
            <tr>
              <td style="background:linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);padding:40px 32px;text-align:center;">
                <div style="font-size:32px;margin-bottom:8px;">📸</div>
                <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Contestify</h1>
                <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;font-weight:500;">Creator Contest Platform</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px 32px;">
                <h2 style="margin:0 0 8px;color:#ffffff;font-size:20px;font-weight:700;">Reset Your Password</h2>
                <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;line-height:1.6;">
                  We received a request to reset the password for your Contestify account. Click the button below to choose a new password. This link expires in <strong style="color:#f59e0b;">15 minutes</strong>.
                </p>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding:8px 0 24px;">
                      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#dc2743,#bc1888);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:100px;letter-spacing:0.3px;">
                        Reset My Password →
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Divider -->
                <hr style="border:none;border-top:1px solid #262626;margin:0 0 20px;" />

                <p style="margin:0 0 8px;color:#71717a;font-size:12px;line-height:1.5;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="margin:0 0 24px;word-break:break-all;">
                  <a href="${resetUrl}" style="color:#dc2743;font-size:11px;text-decoration:none;">${resetUrl}</a>
                </p>

                <div style="background:#1a1a1a;border:1px solid #262626;border-radius:12px;padding:14px 16px;">
                  <p style="margin:0;color:#71717a;font-size:11px;line-height:1.6;">
                    🔒 If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged. 
                    For security, this link can only be used <strong style="color:#a1a1aa;">once</strong> and expires in 15 minutes.
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 32px 28px;text-align:center;border-top:1px solid #1a1a1a;">
                <p style="margin:0;color:#52525b;font-size:11px;">
                  © ${new Date().getFullYear()} Contestify · Creator Contest Platform · India
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  // Use global fetch on Node 18+ (Render uses Node 18+)
  const fetchClient = typeof fetch !== "undefined" ? fetch : (await import("node-fetch")).default;

  const payload = {
    from: process.env.EMAIL_FROM || "Contestify 📸 <onboarding@resend.dev>",
    to: [toEmail],
    subject: "Reset your Contestify password",
    html: html
  };

  const response = await fetchClient("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Resend API Error: ${errorData}`);
  }
};

module.exports = { sendPasswordResetEmail };
