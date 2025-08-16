const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

async function setWebhook() {
  const webhookUrl = `${BASE_URL}/api/telegram/bot/webhook`;

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message"],
      }),
    }
  );

  const result = await response.json();
  console.log("Webhook setup result:", result);
}

setWebhook();
