// app/api/telegram/bot/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import { formatUnits } from "viem";
import { multicall } from "@wagmi/core";
import { erc20Abi } from "viem";
import { wagmiConfig } from "@/lib/config/wagmi";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  sendOrderSchema,
  transferOrderSchema,
} from "@/schemas/telegram-orders.schema";
import {
  generateSessionToken,
  generateOnrampURL,
} from "@/lib/coinbase/ramp-utils";

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

// User session type
type UserSession = {
  action: string;
  network?: string;
  sourceNetwork?: string;
  destinationNetwork?: string;
  step?: string;
  address?: string;
  amount?: string;
};

// Simple state management for user sessions
const userSessions = new Map<string, UserSession>();

// USDC token addresses for different chains
const USDC_TOKENS = {
  ethereum: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  arbitrum: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
  avalanche: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
  base: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
};

const CHAIN_IDS = {
  ethereum: 1,
  arbitrum: 42161,
  avalanche: 43114,
  base: 8453,
};

async function fetchTokenBalances(walletAddress: string) {
  const balances: { [chain: string]: string } = {};

  // Initialize all balances to $0.00
  for (const chain of Object.keys(USDC_TOKENS)) {
    balances[chain] = "$0.00";
  }

  try {
    for (const [chain, tokenAddress] of Object.entries(USDC_TOKENS)) {
      const chainId = CHAIN_IDS[chain as keyof typeof CHAIN_IDS];

      try {
        const calls = [
          {
            chainId,
            address: tokenAddress as `0x${string}`,
            functionName: "balanceOf",
            args: [walletAddress as `0x${string}`],
            abi: erc20Abi,
          } as const,
        ];

        console.log(`Fetching balance for ${chain} (chainId: ${chainId})`);

        const results = await multicall(wagmiConfig, {
          chainId,
          contracts: calls,
        });

        console.log(`Results for ${chain}:`, results);

        const balance = results[0].result ?? 0n;
        const formattedBalance = formatUnits(balance, 6); // USDC has 6 decimals
        const usdValue = parseFloat(formattedBalance);

        console.log(
          `${chain} balance:`,
          balance.toString(),
          `formatted:`,
          formattedBalance,
          `USD:`,
          usdValue
        );

        balances[chain] = usdValue > 0 ? `$${usdValue.toFixed(2)}` : "$0.00";
      } catch (chainError) {
        console.error(`Error fetching balance for ${chain}:`, chainError);
        balances[chain] = "$0.00"; // Fallback to $0.00 on error
      }
    }
  } catch (error) {
    console.error("Error in fetchTokenBalances:", error);
  }

  return balances;
}

async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyMarkup?: {
    inline_keyboard: Array<Array<{ text: string; web_app?: { url: string } }>>;
  }
) {
  try {
    console.log("Sending Telegram message:", { chatId, text, replyMarkup });
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
          ...(replyMarkup && { reply_markup: replyMarkup }),
        }),
      }
    );
    const result = await response.json();
    console.log("Telegram API response:", result);
    return result;
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    throw error;
  }
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
  callback_query?: {
    id: string;
    data?: string;
    from?: {
      id?: number;
    };
    message?: {
      chat: {
        id: number;
      };
      message_id: number;
    };
  };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as TelegramUpdate;

  // Handle callback queries (button clicks)
  if (body.callback_query) {
    await handleCallbackQuery(body.callback_query);
    return NextResponse.json({});
  }

  const chatId = body.message?.chat.id;
  const messageText = body.message?.text;
  const tgId = body.message?.from?.id?.toString();

  console.log("Received message:", { chatId, messageText, tgId });

  if (!chatId || !messageText) {
    return NextResponse.json({ error: "Invalid message" });
  }

  // Check if user has a pending session
  const userSession = userSessions.get(tgId!);
  console.log("Current user session:", userSession);
  console.log("Message text:", messageText);
  console.log("Message starts with /:", messageText.startsWith("/"));

  if (userSession && !messageText.startsWith("/")) {
    console.log("Processing session action:", userSession.action);
    switch (userSession.action) {
      case "buy":
        await handleBuyAmountWithButtons(
          chatId,
          tgId!,
          userSession.network!,
          messageText
        );
        return NextResponse.json({});
      case "send":
        await handleSendInput(chatId, tgId!, userSession, messageText);
        return NextResponse.json({});
      case "transfer":
        await handleTransferInput(chatId, tgId!, userSession, messageText);
        return NextResponse.json({});
    }
  }

  // Handle different commands
  console.log("Processing command:", messageText);
  switch (messageText) {
    case "/start":
      console.log("Handling /start command");
      await handleStartCommand(chatId);
      break;
    case "/account":
      console.log("Handling /account command");
      await handleAccountCommand(chatId, tgId);
      break;
    case "/send":
      console.log("Handling /send command");
      await handleSendCommand(chatId, messageText);
      break;
    case "/transfer":
      console.log("Handling /transfer command");
      await handleTransferCommand(chatId, messageText);
      break;
    case "/buy":
      console.log("Handling /buy command");
      await handleBuyCommand(chatId, messageText);
      break;
    case "/help":
      console.log("Handling /help command");
      await handleHelpCommand(chatId);
      break;
    default:
      console.log("Handling default message");
      await handleDefaultMessage(chatId, messageText);
      break;
  }

  return NextResponse.json({});
}

// Command handlers
async function handleStartCommand(chatId: number) {
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Open Account",
            web_app: {
              url: "https://t.me/eth_global_test_bot/ethglobal",
            },
          },
        ],
      ],
    },
  };

  await sendTelegramMessage(
    chatId,
    "Welcome! Please tap the button below to open the app. To see a list of helpful commands, enter /help",
    opts.reply_markup
  );
}

async function handleAccountCommand(chatId: number, tgId?: string) {
  console.log("handleAccountCommand called with:", { chatId, tgId });

  if (!tgId) {
    console.log("No tgId provided");
    await sendTelegramMessage(chatId, "Cannot determine your Telegram ID.");
    return;
  }

  try {
    const user = await privy.getUserByTelegramUserId(tgId);
    if (!user) {
      await sendTelegramMessage(
        chatId,
        "No associated Privy user found. Please connect your wallet first."
      );
      return;
    }

    const walletAccount = user.wallet;
    if (!walletAccount) {
      await sendTelegramMessage(chatId, "No wallet linked to your account.");
      return;
    }

    const walletAddress = walletAccount.address;
    const tokenBalances = await fetchTokenBalances(walletAddress);

    const summary = `💰 Your Wallet Info:\n\nAddress: ${walletAddress}\nChain: ${walletAccount.chainType === "ethereum" ? "EVM" : "N/A"}\n\n💵 USDC Balances:\n• Ethereum: ${tokenBalances.ethereum}\n• Arbitrum: ${tokenBalances.arbitrum}\n• Avalanche: ${tokenBalances.avalanche}\n• Base: ${tokenBalances.base}`;

    await sendTelegramMessage(chatId, summary);
  } catch (error) {
    console.error("Error fetching wallet:", error);
    await sendTelegramMessage(
      chatId,
      "Error retrieving your wallet. Try again later."
    );
  }
}

async function handleSendCommand(chatId: number, messageText: string) {
  // Check if this is just /send without parameters
  if (messageText.trim() === "/send") {
    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: "🌐 Ethereum",
            callback_data: "send_ethereum",
          },
          {
            text: "🔵 Base",
            callback_data: "send_base",
          },
        ],
        [
          {
            text: "🟠 Arbitrum",
            callback_data: "send_arbitrum",
          },
          {
            text: "❄️ Avalanche",
            callback_data: "send_avalanche",
          },
        ],
        [
          {
            text: "❌ Cancel",
            callback_data: "send_cancel",
          },
        ],
      ],
    };

    await sendTelegramMessage(
      chatId,
      "📤 Send USDC to an address\n\nPlease select the source network:",
      replyMarkup
    );
    return;
  }

  // If parameters are provided, show usage help
  const helpMessage = `📤 Send USDC to an address\n\nUsage: /send\n\nSimply type /send to get started with the interactive menu!`;
  await sendTelegramMessage(chatId, helpMessage);
}

async function handleTransferCommand(chatId: number, messageText: string) {
  // Check if this is just /transfer without parameters
  if (messageText.trim() === "/transfer") {
    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: "🌐 Ethereum",
            callback_data: "transfer_source_ethereum",
          },
          {
            text: "🔵 Base",
            callback_data: "transfer_source_base",
          },
        ],
        [
          {
            text: "🟠 Arbitrum",
            callback_data: "transfer_source_arbitrum",
          },
          {
            text: "❄️ Avalanche",
            callback_data: "transfer_source_avalanche",
          },
        ],
        [
          {
            text: "❌ Cancel",
            callback_data: "transfer_cancel",
          },
        ],
      ],
    };

    await sendTelegramMessage(
      chatId,
      "🔄 Transfer USDC to a new blockchain\n\nPlease select the source network:",
      replyMarkup
    );
    return;
  }

  // If parameters are provided, show usage help
  const helpMessage = `🔄 Transfer USDC to a new blockchain\n\nUsage: /transfer\n\nSimply type /transfer to get started with the interactive menu!`;
  await sendTelegramMessage(chatId, helpMessage);
}

async function handleHelpCommand(chatId: number) {
  const helpMessage = `💡 Available commands:\n\n/account - Get details about your account and token balances\n/send - Send USDC to an address\n/transfer - Transfer USDC to a new blockchain\n/buy - Buy USDC with cash on Coinbase\n/cancel - Cancel current operation and reset session\n\n💡 Try one of the commands above!`;
  await sendTelegramMessage(chatId, helpMessage);
}
async function handleSendInput(
  chatId: number,
  tgId: string,
  userSession: UserSession,
  input: string
) {
  console.log("handleSendInput called with:", {
    chatId,
    tgId,
    userSession,
    input,
  });

  switch (userSession.step) {
    case "address":
      console.log("Processing address step");
      // Validate address format (basic check)
      if (!input.startsWith("0x") || input.length !== 42) {
        const replyMarkup = {
          inline_keyboard: [
            [
              {
                text: "❌ Cancel",
                callback_data: "send_cancel",
              },
            ],
          ],
        };
        await sendTelegramMessage(
          chatId,
          "❌ Invalid address format. Please enter a valid Ethereum address (0x...):",
          replyMarkup
        );
        return;
      }

      // Store address and move to amount step
      const updatedSession = {
        ...userSession,
        address: input,
        step: "amount",
      };
      userSessions.set(tgId, updatedSession);
      console.log("Updated session for amount step:", updatedSession);
      console.log("Session stored in map:", userSessions.get(tgId));

      const replyMarkup = {
        inline_keyboard: [
          [
            {
              text: "❌ Cancel",
              callback_data: "send_cancel",
            },
          ],
        ],
      };

      // Get user's USDC balance on the selected network
      const user = await privy.getUserByTelegramUserId(tgId);
      let balanceDisplay = "Balance: Loading...";

      if (user?.wallet?.address) {
        const tokenBalances = await fetchTokenBalances(user.wallet.address);
        const networkKey = userSession.network as keyof typeof tokenBalances;
        balanceDisplay = `Balance: ${tokenBalances[networkKey]}`;
      }

      await sendTelegramMessage(
        chatId,
        `📝 Address: ${input}\n\n💰 Please enter the amount of USDC to send:\n${balanceDisplay}`,
        replyMarkup
      );
      break;

    case "amount":
      console.log("Processing amount step");
      console.log("Current session in amount step:", userSession);
      const amount = parseFloat(input);
      if (isNaN(amount) || amount <= 0) {
        const replyMarkup = {
          inline_keyboard: [
            [
              {
                text: "❌ Cancel",
                callback_data: "send_cancel",
              },
            ],
          ],
        };
        await sendTelegramMessage(
          chatId,
          "❌ Invalid amount. Please enter a valid amount greater than 0:",
          replyMarkup
        );
        return;
      }

      console.log("Amount valid, showing confirmation with:", {
        network: userSession.network,
        address: userSession.address,
        amount: amount.toFixed(2),
      });

      // Store the amount in the session and use a shorter callback data
      userSessions.set(tgId, {
        ...userSession,
        amount: amount.toFixed(2),
      });

      const callbackData = `send_confirm_${userSession.network}_${amount.toFixed(2)}`;
      console.log(
        "Sending confirmation message with callback data:",
        callbackData
      );
      console.log("Callback data length:", callbackData.length, "bytes");

      const confirmReplyMarkup = {
        inline_keyboard: [
          [
            {
              text: "✅ Confirm",
              callback_data: callbackData,
            },
            {
              text: "❌ Cancel",
              callback_data: "send_cancel",
            },
          ],
        ],
      };

      console.log("About to send confirmation message");
      await sendTelegramMessage(
        chatId,
        `📋 Confirm your send order:\n\n• Network: ${userSession.network}\n• Address: ${userSession.address}\n• Amount: ${amount.toFixed(2)} USDC\n\nPlease confirm or cancel:`,
        confirmReplyMarkup
      );
      console.log("Confirmation message sent successfully");
      break;

    default:
      console.log("Unknown step:", userSession.step);
      await sendTelegramMessage(
        chatId,
        "❌ Invalid session state. Please start over with /send"
      );
      userSessions.delete(tgId);
      break;
  }
}

async function handleTransferInput(
  chatId: number,
  tgId: string,
  userSession: UserSession,
  input: string
) {
  switch (userSession.step) {
    case "destination":
      // This should be handled by callback, not text input
      break;

    case "amount":
      const amount = parseFloat(input);
      if (isNaN(amount) || amount <= 0) {
        const replyMarkup = {
          inline_keyboard: [
            [
              {
                text: "❌ Cancel",
                callback_data: "transfer_cancel",
              },
            ],
          ],
        };
        await sendTelegramMessage(
          chatId,
          "❌ Invalid amount. Please enter a valid amount greater than 0:",
          replyMarkup
        );
        return;
      }

      // Show confirmation
      const confirmReplyMarkup = {
        inline_keyboard: [
          [
            {
              text: "✅ Confirm",
              callback_data: `transfer_confirm_${userSession.sourceNetwork}_${userSession.destinationNetwork}_${amount.toFixed(2)}`,
            },
            {
              text: "❌ Cancel",
              callback_data: "transfer_cancel",
            },
          ],
        ],
      };

      await sendTelegramMessage(
        chatId,
        `📋 Confirm your transfer order:\n\n• From: ${userSession.sourceNetwork}\n• To: ${userSession.destinationNetwork}\n• Amount: ${amount.toFixed(2)} USDC\n\nPlease confirm or cancel:`,
        confirmReplyMarkup
      );
      break;
  }
}

async function handleBuyAmountWithButtons(
  chatId: number,
  tgId: string,
  network: string,
  amountText: string
) {
  const amount = parseFloat(amountText);

  // Validate amount
  if (isNaN(amount) || amount <= 5) {
    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: "❌ Cancel",
            callback_data: "buy_cancel",
          },
        ],
      ],
    };
    await sendTelegramMessage(
      chatId,
      "❌ Invalid amount. Amount must be greater than $5. Please try again:",
      replyMarkup
    );
    return;
  }

  // Check decimal places
  const decimalPlaces = amountText.split(".")[1]?.length || 0;
  if (decimalPlaces > 2) {
    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: "❌ Cancel",
            callback_data: "buy_cancel",
          },
        ],
      ],
    };
    await sendTelegramMessage(
      chatId,
      "❌ Invalid amount. Amount can have no more than 2 decimal places. Please try again:",
      replyMarkup
    );
    return;
  }

  // Show confirmation with buttons
  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: "✅ Confirm",
          callback_data: `buy_confirm_${network}_${amount.toFixed(2)}`,
        },
        {
          text: "❌ Cancel",
          callback_data: "buy_cancel",
        },
      ],
    ],
  };

  await sendTelegramMessage(
    chatId,
    `📋 Confirm your order:\n\n• Network: ${network}\n• Amount: $${amount.toFixed(2)}\n\nPlease confirm or cancel:`,
    replyMarkup
  );
}

async function handleBuyCommand(chatId: number, messageText: string) {
  // Check if this is just /buy without parameters
  if (messageText.trim() === "/buy") {
    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: "🌐 Ethereum",
            callback_data: "buy_ethereum",
          },
          {
            text: "🔵 Base",
            callback_data: "buy_base",
          },
        ],
        [
          {
            text: "❌ Cancel",
            callback_data: "buy_cancel",
          },
        ],
      ],
    };

    await sendTelegramMessage(
      chatId,
      "💳 Buy USDC with cash on Coinbase\n\nPlease select a network:",
      replyMarkup
    );
    return;
  }

  // If parameters are provided, show usage help
  const helpMessage = `💳 Buy USDC with cash on Coinbase\n\nUsage: /buy\n\nSimply type /buy to get started with the interactive menu!`;
  await sendTelegramMessage(chatId, helpMessage);
}

async function handleCallbackQuery(
  callbackQuery: NonNullable<TelegramUpdate["callback_query"]>
) {
  const chatId = callbackQuery.message?.chat.id;
  const messageId = callbackQuery.message?.message_id;
  const data = callbackQuery.data;
  const tgId = callbackQuery.from?.id?.toString();

  console.log("Received callback query:", { chatId, messageId, data, tgId });

  if (!chatId || !data) {
    return;
  }

  // Answer the callback query to remove loading state
  await answerCallbackQuery(callbackQuery.id);

  switch (data) {
    case "buy_ethereum":
      // Store user session
      userSessions.set(tgId!, { action: "buy", network: "ethereum" });
      const ethereumReplyMarkup = {
        inline_keyboard: [
          [
            {
              text: "❌ Cancel",
              callback_data: "buy_cancel",
            },
          ],
        ],
      };
      await sendTelegramMessage(
        chatId,
        "🌐 You selected Ethereum network!\n\n💰 Please enter the amount you want to buy (minimum $5):",
        ethereumReplyMarkup
      );
      break;
    case "buy_base":
      // Store user session
      userSessions.set(tgId!, { action: "buy", network: "base" });
      const baseReplyMarkup = {
        inline_keyboard: [
          [
            {
              text: "❌ Cancel",
              callback_data: "buy_cancel",
            },
          ],
        ],
      };
      await sendTelegramMessage(
        chatId,
        "🔵 You selected Base network!\n\n💰 Please enter the amount you want to buy (minimum $5):",
        baseReplyMarkup
      );
      break;
    case "send_ethereum":
    case "send_base":
    case "send_arbitrum":
    case "send_avalanche":
      const sendNetwork = data.split("_")[1];
      userSessions.set(tgId!, {
        action: "send",
        network: sendNetwork,
        step: "address",
      });
      const sendReplyMarkup = {
        inline_keyboard: [
          [
            {
              text: "❌ Cancel",
              callback_data: "send_cancel",
            },
          ],
        ],
      };
      await sendTelegramMessage(
        chatId,
        `🌐 You selected ${sendNetwork} network!\n\n📝 Please enter the recipient address:`,
        sendReplyMarkup
      );
      break;
    case "transfer_source_ethereum":
    case "transfer_source_base":
    case "transfer_source_arbitrum":
    case "transfer_source_avalanche":
      const sourceNetwork = data.split("_")[2];
      userSessions.set(tgId!, {
        action: "transfer",
        sourceNetwork,
        step: "destination",
      });

      // Create destination buttons excluding the source network
      const destinationButtons = [];
      const allNetworks = [
        {
          text: "🌐 Ethereum",
          callback: "transfer_dest_ethereum",
          network: "ethereum",
        },
        { text: "🔵 Base", callback: "transfer_dest_base", network: "base" },
        {
          text: "🟠 Arbitrum",
          callback: "transfer_dest_arbitrum",
          network: "arbitrum",
        },
        {
          text: "❄️ Avalanche",
          callback: "transfer_dest_avalanche",
          network: "avalanche",
        },
      ];

      const availableNetworks = allNetworks.filter(
        (net) => net.network !== sourceNetwork
      );

      // Split into rows of 2 buttons
      for (let i = 0; i < availableNetworks.length; i += 2) {
        const row = availableNetworks.slice(i, i + 2).map((net) => ({
          text: net.text,
          callback_data: net.callback,
        }));
        destinationButtons.push(row);
      }

      // Add cancel button
      destinationButtons.push([
        {
          text: "❌ Cancel",
          callback_data: "transfer_cancel",
        },
      ]);

      const transferSourceReplyMarkup = {
        inline_keyboard: destinationButtons,
      };

      await sendTelegramMessage(
        chatId,
        `🌐 Source network: ${sourceNetwork}\n\n🔵 Please select the destination network:`,
        transferSourceReplyMarkup
      );
      break;
    case "transfer_dest_ethereum":
    case "transfer_dest_base":
    case "transfer_dest_arbitrum":
    case "transfer_dest_avalanche":
      const destNetwork = data.split("_")[2];
      const currentSession = userSessions.get(tgId!);
      if (currentSession && currentSession.action === "transfer") {
        userSessions.set(tgId!, {
          ...currentSession,
          destinationNetwork: destNetwork,
          step: "amount",
        });

        const transferDestReplyMarkup = {
          inline_keyboard: [
            [
              {
                text: "❌ Cancel",
                callback_data: "transfer_cancel",
              },
            ],
          ],
        };

        // Get user's USDC balance on the source network
        const user = await privy.getUserByTelegramUserId(tgId!);
        let balanceDisplay = "Balance: Loading...";

        if (user?.wallet?.address) {
          const tokenBalances = await fetchTokenBalances(user.wallet.address);
          const networkKey =
            currentSession.sourceNetwork as keyof typeof tokenBalances;
          balanceDisplay = `Balance: ${tokenBalances[networkKey]}`;
        }

        await sendTelegramMessage(
          chatId,
          `🔄 Transfer from ${currentSession.sourceNetwork} to ${destNetwork}\n\n💰 Please enter the amount of USDC to transfer:\n${balanceDisplay}`,
          transferDestReplyMarkup
        );
      }
      break;
    case "buy_cancel":
    case "send_cancel":
    case "transfer_cancel":
      // Clear any existing session
      userSessions.delete(tgId!);
      const action = data.split("_")[0];
      await sendTelegramMessage(
        chatId,
        `❌ ${action.charAt(0).toUpperCase() + action.slice(1)} operation cancelled.\n\n💡 Type /help to see available commands.`
      );
      break;
    default:
      // Handle buy confirmation
      if (data.startsWith("buy_confirm_")) {
        const parts = data.split("_");
        const network = parts[2];
        const amount = parts[3];

        // Create buy order object
        const buyOrder = {
          type: "buy" as const,
          network,
          amount,
          user: tgId!,
          timestamp: new Date().toISOString(),
        };

        console.log("Coinbase onramp link generated:", buyOrder);

        try {
          // Get user's wallet address from Privy
          const user = await privy.getUserByTelegramUserId(tgId!);
          if (!user?.wallet?.address) {
            throw new Error("No wallet address found for user");
          }

          console.log("Generating fresh session token for user:", tgId);

          // Generate fresh session token for this request
          const sessionResult = await generateSessionToken({
            addresses: [
              {
                address: user.wallet.address,
                blockchains: [network],
              },
            ],
            assets: ["USDC"],
          });

          console.log("Session token generated:", {
            sessionToken: sessionResult.sessionToken?.substring(0, 20) + "...",
            channelId: sessionResult.channelId,
          });

          // Generate Coinbase onramp URL with fresh session token
          const onrampURL = generateOnrampURL({
            asset: "USDC",
            amount: amount,
            network: network,
            fiatCurrency: "USD",
            redirectUrl: "https://t.me/eth_global_test_bot",
            sessionToken: sessionResult.sessionToken,
            telegramId: tgId!,
          });

          console.log(
            "Onramp URL generated:",
            onrampURL.substring(0, 100) + "..."
          );

          // Clear the user session
          userSessions.delete(tgId!);

          await sendTelegramMessage(
            chatId,
            `✅ Coinbase onramp link generated!\n\n📋 Order Details:\n• Network: ${network}\n• Amount: $${amount}\n• Address: ${user.wallet.address}\n\n🔗 Hit the following link to buy USDC for your account:\n${onrampURL}`
          );
        } catch (error) {
          console.error("Error processing buy order:", error);
          await sendTelegramMessage(
            chatId,
            `❌ Error processing buy order. Please try again or contact support.`
          );
        }
      } else if (data.startsWith("send_confirm_")) {
        console.log("Processing send_confirm callback with data:", data);
        const parts = data.split("_");
        console.log("Split parts:", parts);
        const network = parts[2];
        const amount = parts[3];

        // Get the address from the user session
        const userSession = userSessions.get(tgId!);
        const address = userSession?.address;

        console.log("Parsed values:", { network, amount, address });

        if (!address) {
          console.error("No address found in session");
          await sendTelegramMessage(
            chatId,
            "❌ Error: No address found in session. Please try again."
          );
          return;
        }

        // Create send order object
        const sendOrder = {
          type: "send" as const,
          network,
          address,
          amount,
          user: tgId!,
          timestamp: new Date().toISOString(),
        };

        console.log("Send order confirmed:", sendOrder);

        try {
          // Validate the send order with Zod schema
          const { env } = getCloudflareContext();
          const validatedSendOrder = sendOrderSchema.parse(sendOrder);

          // Send to send orders queue
          await env["my-queue"].send(validatedSendOrder);
          console.log(
            "Send order processed successfully - sent to send-orders-queue"
          );

          // Clear the user session
          userSessions.delete(tgId!);

          await sendTelegramMessage(
            chatId,
            `✅ Send order confirmed!\n\n📋 Order Details:\n• Network: ${network}\n• Address: ${address}\n• Amount: ${amount} USDC\n\nYour order has been queued for processing!`
          );
        } catch (error) {
          console.error("Error processing send order:", error);
          await sendTelegramMessage(
            chatId,
            `❌ Error processing send order. Please try again or contact support.`
          );
        }
      } else if (data.startsWith("transfer_confirm_")) {
        const parts = data.split("_");
        const sourceNetwork = parts[2];
        const destNetwork = parts[3];
        const amount = parts[4];

        // Create transfer order object
        const transferOrder = {
          type: "transfer" as const,
          sourceNetwork,
          destNetwork,
          amount,
          user: tgId!,
          timestamp: new Date().toISOString(),
        };

        console.log("Transfer order confirmed:", transferOrder);

        try {
          // Validate the transfer order with Zod schema
          const { env } = getCloudflareContext();
          const validatedTransferOrder =
            transferOrderSchema.parse(transferOrder);

          // Send to transfer orders queue
          await env["my-queue"].send(validatedTransferOrder);
          console.log(
            "Transfer order processed successfully - sent to transfer-orders-queue"
          );

          // Clear the user session
          userSessions.delete(tgId!);

          await sendTelegramMessage(
            chatId,
            `✅ Transfer order confirmed!\n\n📋 Order Details:\n• From: ${sourceNetwork}\n• To: ${destNetwork}\n• Amount: ${amount} USDC\n\nYour order has been queued for processing!`
          );
        } catch (error) {
          console.error("Error processing transfer order:", error);
          await sendTelegramMessage(
            chatId,
            `❌ Error processing transfer order. Please try again or contact support.`
          );
        }
      } else {
        await sendTelegramMessage(chatId, "❌ Unknown button action.");
      }
      break;
  }
}

async function answerCallbackQuery(callbackQueryId: string) {
  try {
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
        }),
      }
    );
  } catch (error) {
    console.error("Error answering callback query:", error);
  }
}

async function handleDefaultMessage(chatId: number, messageText: string) {
  // Check if it looks like a command (starts with /)
  if (messageText.startsWith("/")) {
    const helpMessage = `❌ Unknown command: ${messageText}\n\n📋 Available commands:\n\n/account - Get details about your account and token balances\n/send - Send USDC to an address\n/transfer - Transfer USDC to a new blockchain\n/buy - Buy USDC with cash on Coinbase\n/cancel - Cancel current operation and reset session\n\n💡 Try one of the commands above!`;
    await sendTelegramMessage(chatId, helpMessage);
  } else {
    const helpMessage = `Available commands:\n\n/help - See a list of helpful commands\n/account - Get details about your account and token balances\n/send - Send USDC to an address\n/transfer - Transfer USDC to a new blockchain\n/buy - Buy USDC with cash on Coinbase\n/cancel - Cancel current operation and reset session\n\n💡 Try one of the commands above!`;

    await sendTelegramMessage(chatId, helpMessage);
  }
}
