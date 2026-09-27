require('dotenv').config();

const payload = {
  from: 'Contestify <onboarding@resend.dev>',
  to: ['geekykalpesh@gmail.com'],
  subject: 'Test from Resend',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
};

async function testResend() {
  const fetchClient = typeof fetch !== "undefined" ? fetch : (await import("node-fetch")).default;

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
    console.error(`Resend API Error: ${errorData}`);
  } else {
    const data = await response.json();
    console.log("Success:", data);
  }
}

testResend();
