  const fetch = (await import('node-fetch')).default || global.fetch;
  
  const payload = {
    sender: {
      name: "Contestify 📸",
      email: "geekykalpesh@gmail.com" // Must match verified sender in Brevo
    },
    to: [
      {
        email: toEmail
      }
    ],
    subject: "Reset your Contestify password",
    htmlContent: html
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
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
    throw new Error(`Brevo API Error: ${errorData}`);
  }
};

module.exports = { sendPasswordResetEmail };
