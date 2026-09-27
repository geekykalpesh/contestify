import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { to, resetUrl, emailUser, emailPass } = req.body;

  if (!to || !resetUrl || !emailUser || !emailPass) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

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
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1a1a1a;border-radius:24px;overflow:hidden;border:1px solid #333;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
              <tr>
                <td style="padding:48px 32px;text-align:center;">
                  <h2 style="margin:0;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Password Reset Request</h2>
                  <p style="margin:16px 0 32px 0;font-size:15px;color:#a3a3a3;line-height:1.6;max-width:400px;display:inline-block;">
                    We received a request to reset the password for your Contestify account. Click the button below to set a new password.
                  </p>
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                    <tr>
                      <td align="center" style="border-radius:12px;background:linear-gradient(135deg, #0ea5e9, #3b82f6);">
                        <a href="${resetUrl}" style="display:inline-block;padding:16px 32px;color:#fff;font-size:15px;font-weight:bold;text-decoration:none;border-radius:12px;text-shadow:0 1px 2px rgba(0,0,0,0.2);">Reset My Password</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:32px 0 0 0;font-size:13px;color:#666;">
                    If you didn't request this, you can safely ignore this email.
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

    await transporter.sendMail({
      from: '"Contestify" <' + emailUser + '>',
      to,
      subject: "Reset Your Password - Contestify",
      html
    });

    return res.status(200).json({ success: true, message: "Email sent successfully via Vercel" });
  } catch (error) {
    console.error("Vercel Nodemailer Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
