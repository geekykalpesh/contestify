require('dotenv').config();

const html = `<h1>Test</h1>`;
const payload = {
  sender: {
    name: "Contestify 📸",
    email: "geekykalpesh@gmail.com"
  },
  to: [
    {
      email: "geekykalpesh@gmail.com"
    }
  ],
  subject: "Test from Brevo",
  htmlContent: html
};

async function testBrevo() {
  const fetchClient = typeof fetch !== "undefined" ? fetch : (await import("node-fetch")).default;

  const response = await fetchClient("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`Brevo API Error: ${errorData}`);
  } else {
    const data = await response.json();
    console.log("Success:", data);
  }
}

testBrevo();
