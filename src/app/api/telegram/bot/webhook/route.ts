// app/api/telegram/bot/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";

// Check required environment variables
if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("TELEGRAM_TOKEN environment variable is not set");
}
if (!process.env.PRIVY_APP_ID) {
  throw new Error("PRIVY_APP_ID environment variable is not set");
}
if (!process.env.PRIVY_APP_SECRET) {
  throw new Error("PRIVY_APP_SECRET environment variable is not set");
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const PRIVY_APP_ID = process.env.PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

const privy = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

async function sendTelegramMessage(chatId: number, text: string) {
  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    }
  );
  return response.json();
}

interface TelegramUpdate {
  message?: {
    text?: string;
    from?: {
      id?: number;
    };
    chat: {
      id: number;
    };
  };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as TelegramUpdate;

  // Handle /mywallet command
  if (body.message?.text === "/mywallet") {
    const tgId = body.message.from?.id?.toString();
    if (!tgId) {
      await sendTelegramMessage(
        body.message.chat.id,
        "Cannot determine your Telegram ID."
      );
      return NextResponse.json({});
    }

    try {
      const user = await privy.getUserByTelegramUserId(tgId);
      if (!user) {
        await sendTelegramMessage(
          body.message.chat.id,
          "No associated Privy user found. Please connect your wallet first."
        );
        return NextResponse.json({});
      }

      const walletAccount = user.wallet;

      if (!walletAccount) {
        await sendTelegramMessage(
          body.message.chat.id,
          "No wallet linked to your account."
        );
        return NextResponse.json({});
      }

      const walletAddress = walletAccount.address;
      const summary = `💰 Your Wallet Info:\n\nAddress: ${walletAddress}\nChain: ${walletAccount.chainType === "ethereum" ? "EVM" : "N/A"}\nNetwork: ${walletAccount.chainId}\nWallet Type: ${walletAccount.walletClientType}`;
      await sendTelegramMessage(body.message.chat.id, summary);
    } catch (error) {
      console.error("Error fetching wallet:", error);
      await sendTelegramMessage(
        body.message.chat.id,
        "Error retrieving your wallet. Try again later."
      );
    }
  } else if (body.message?.text) {
    // Echo all other messages for testing
    const responses = [
      `Stop copying me! "${body.message.text}"`,
      `I heard you say "${body.message.text}" - very original! 😏`,
      `"${body.message.text}" - wow, what a genius you are! 🤪`,
      `Echo echo echo: "${body.message.text}"`,
      `You: "${body.message.text}" Me: "${body.message.text}" - we're so in sync! 🎭`,
    ];
    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];
    await sendTelegramMessage(body.message.chat.id, randomResponse);
  }

  return NextResponse.json({});
}
