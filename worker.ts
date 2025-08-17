// eslint-disable-next-line
// @ts-ignore Generated during build
import { PrivyClient } from "@privy-io/server-auth";
import { default as handler } from "./.open-next/worker.js";
import { SendOrder, TransferOrder } from "./src/schemas/telegram-orders.schema";
import {
  isAddress,
  parseUnits,
  encodeFunctionData,
  Hex,
  Address,
  toBytes,
  zeroAddress,
} from "viem";
import { erc20Abi } from "viem";
import { arbitrum, avalanche, base, mainnet } from "viem/chains";
import {
  CHAIN_IDS_TO_MESSAGE_TRANSMITTER_ADDRESSES_CCTP_V2,
  CHAIN_IDS_TO_SOURCE_DOMAIN_ID_CCTP_V1,
} from "@/lib/tokens/master.js";

interface MessagesResponse {
  attestation?: Hex | "PENDING";
  message?: Hex;
  eventNonce?: string;
}

interface CircleMessagesResponse {
  messages: MessagesResponse[];
  error?: string;
}

async function fetchAttestationCCTPV2(
  burnTxHash: string,
  sourceChainId: number
) {
  const response = await fetch(
    `https://iris-api.circle.com/v2/messages/${CHAIN_IDS_TO_SOURCE_DOMAIN_ID_CCTP_V1[sourceChainId]}?transactionHash=${burnTxHash}`
  );
  const messagesResponse: CircleMessagesResponse = await response.json();
  const messageResponse = messagesResponse?.messages?.[0];
  return messageResponse;
}

export async function getMessageAndAttestationV2(
  sourceChainId: number,
  burnTxHash: string
) {
  const messageResponse = await fetchAttestationCCTPV2(
    burnTxHash,
    sourceChainId
  );
  return messageResponse;
}

// Function to send Telegram message
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  env: CloudflareEnv
) {
  const TELEGRAM_TOKEN = env.TELEGRAM_TOKEN;
  if (!TELEGRAM_TOKEN) {
    console.error("TELEGRAM_TOKEN environment variable is not set");
    return;
  }

  try {
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

    const result = (await response.json()) as {
      ok: boolean;
      description?: string;
    };
    if (!result.ok) {
      console.error("Failed to send Telegram message:", result);
    } else {
      console.log("Telegram message sent successfully");
    }
  } catch (error) {
    console.error("Error sending Telegram message:", error);
  }
}

// USDC token addresses for different chains
export const USDC_TOKENS = {
  ethereum: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  arbitrum: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
  avalanche: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
  base: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
} as const;

export const CHAIN_IDS = {
  ethereum: 1,
  arbitrum: 42161,
  avalanche: 43114,
  base: 8453,
} as const;

export default {
  fetch: handler.fetch,
  async queue(batch, env): Promise<void> {
    for (const message of batch.messages) {
      try {
        const { type } = message.body as { type: string };

        if (!env.PRIVY_APP_ID) {
          throw new Error("PRIVY_APP_ID environment variable is not set");
        }
        if (!env.PRIVY_APP_SECRET) {
          throw new Error("PRIVY_APP_SECRET environment variable is not set");
        }

        const PRIVY_APP_ID = env.PRIVY_APP_ID;
        const PRIVY_APP_SECRET = env.PRIVY_APP_SECRET;

        const privy = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET, {
          walletApi: {
            authorizationPrivateKey: env.PRIVY_WALLET_PRIVATE_KEY,
          },
        });
        console.log(type, message.body);
        if (type === "transfer") {
          const transferOrder = message.body as TransferOrder;
          const user = await privy.getUserByTelegramUserId(transferOrder.user);
          if (!user) {
            throw new Error("User not found");
          }
          console.log(transferOrder);
          const networkToUse =
            transferOrder.sourceNetwork === "base"
              ? base
              : transferOrder.sourceNetwork === "arbitrum"
                ? arbitrum
                : transferOrder.sourceNetwork === "avalanche"
                  ? avalanche
                  : transferOrder.sourceNetwork === "ethereum"
                    ? mainnet
                    : null;
          if (!networkToUse) {
            throw new Error("Invalid network");
          }

          if (!user.wallet?.id) {
            throw new Error("User wallet not found");
          }

          // Create burn transaction data
          const burnData = encodeFunctionData({
            abi: cctpV1MessengerAbi,
            functionName: "depositForBurn",
            args: [
              parseUnits(transferOrder.amount, 6), // USDC has 6 decimals
              CHAIN_IDS_TO_SOURCE_DOMAIN_ID_CCTP_V1[networkToUse.id],
              toBytes(
                CHAIN_IDS_TO_MESSAGE_TRANSMITTER_ADDRESSES_CCTP_V2[
                  networkToUse.id
                ] as Address,
                { size: 32 }
              ) as unknown as `0x${string}`,
              USDC_TOKENS[
                transferOrder.sourceNetwork as keyof typeof USDC_TOKENS
              ] as Address,
              toBytes(zeroAddress, { size: 32 }) as unknown as `0x${string}`,
              0n,
              2000,
            ],
          });

          // TODO: Uncomment if executing burn
          // const messageResponse = await getMessageAndAttestationV2(
          //   sourceChainId,
          //   burnTxHash
          // );
          // const messageBytes = messageResponse.message as Address;
          // const attestation = messageResponse.attestation as Address;
          // const eventNonce = messageResponse.eventNonce as Address;

          // // CCTP ETH
          // const usedNonces = await publicClient.readContract({
          //   address: messageTransmitterAddress as Address,
          //   abi: cctpMessageTransmitterAbi,
          //   functionName: "usedNonces",
          //   args: [eventNonce],
          // });
          // if (usedNonces === 0n) {
          //   const receiveMessageHash = await walletClient.writeContract({
          //     address: messageTransmitterAddress as Address,
          //     abi: cctpMessageTransmitterAbi,
          //     functionName: "receiveMessage",
          //     args: [messageBytes, attestation],
          //   });
          //   const receiveMessageReceipt =
          //     await publicClient.waitForTransactionReceipt({
          //       hash: receiveMessageHash,
          //     });
          //   if (receiveMessageReceipt.status !== "success") {
          //     console.error("receiveMessage transaction failed");
          //   }
          // }

          // Send confirmation message for transfer order
          const transferConfirmationMessage = `✅ USDC depositForBurn Generated!\n\n📋 Transaction Data ${burnData}\n• From: ${transferOrder.sourceNetwork}\n• To: ${transferOrder.destNetwork}\n• Amount: ${transferOrder.amount} USDC\n• Status: Queued for Processing\n\nYour cross-chain transfer request has been received and will be processed shortly!`;

          await sendTelegramMessage(
            transferOrder.user,
            transferConfirmationMessage,
            env
          );
        } else if (type === "send") {
          const sendOrder = message.body as SendOrder;
          const user = await privy.getUserByTelegramUserId(sendOrder.user);
          if (
            !user ||
            !user.wallet ||
            !user.wallet.id ||
            !isAddress(sendOrder.address as `0x${string}`)
          ) {
            throw new Error("User not found");
          }

          // Get USDC token address and chain ID for the network
          const usdcAddress =
            USDC_TOKENS[sendOrder.network as keyof typeof USDC_TOKENS];
          const chainId =
            CHAIN_IDS[sendOrder.network as keyof typeof CHAIN_IDS];

          if (!usdcAddress || !chainId) {
            throw new Error(`Unsupported network: ${sendOrder.network}`);
          }

          // Encode ERC-20 transfer function call
          const transferData = encodeFunctionData({
            abi: erc20Abi,
            functionName: "transfer",
            args: [
              sendOrder.address as `0x${string}`,
              parseUnits(sendOrder.amount, 6),
            ],
          });

          // console.log("Sending ERC-20 transfer:", {
          //   network: sendOrder.network,
          //   from: user.wallet.address,
          //   to: sendOrder.address,
          //   amount: sendOrder.amount,
          //   usdcAddress,
          //   chainId,
          // });

          // const txResponse = await privy.walletApi.ethereum.sendTransaction({
          //   walletId: user.wallet.id,
          //   caip2: `eip155:${chainId}`,
          //   transaction: {
          //     to: usdcAddress as `0x${string}`,
          //     data: transferData,
          //     chainId: chainId,
          //   },
          // });

          // console.log("ERC-20 transfer transaction sent:", {
          //   response: txResponse,
          // });

          // Send confirmation message to user
          const confirmationMessage = `✅ USDC Send Tx Data Generated!\n\n📋 Transaction Data: ${transferData}\n• Network: ${sendOrder.network}\n• From: ${user.wallet.address}\n• To: ${sendOrder.address}\n• Amount: ${sendOrder.amount} USDC\n• Status: Transaction Submitted\n\nYour USDC transfer has been processed successfully!`;

          await sendTelegramMessage(sendOrder.user, confirmationMessage, env);
        } else {
          console.log(`Unknown message type: ${type}`);
        }
        console.log("Message processing completed successfully");
        message.ack();
      } catch (error) {
        console.error(`Error processing message: ${message.id}`, error);
      }
    }
  },
} satisfies ExportedHandler<CloudflareEnv>;

// eslint-disable-next-line
// @ts-ignore Generated during build
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";

export const cctpMessageTransmitterAbi = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "message",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "attestation",
        type: "bytes",
      },
    ],
    name: "receiveMessage",
    outputs: [{ internalType: "bool", name: "success", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "usedNonces",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const cctpV1MessengerAbi = [
  {
    inputs: [
      { internalType: "address", name: "_messageTransmitter", type: "address" },
      { internalType: "uint32", name: "_messageBodyVersion", type: "uint32" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint64", name: "nonce", type: "uint64" },
      {
        indexed: true,
        internalType: "address",
        name: "burnToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "depositor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "mintRecipient",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "destinationDomain",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "destinationTokenMessenger",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "destinationCaller",
        type: "bytes32",
      },
    ],
    name: "DepositForBurn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "localMinter",
        type: "address",
      },
    ],
    name: "LocalMinterAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "localMinter",
        type: "address",
      },
    ],
    name: "LocalMinterRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "mintRecipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "mintToken",
        type: "address",
      },
    ],
    name: "MintAndWithdraw",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferStarted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint32",
        name: "domain",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "tokenMessenger",
        type: "bytes32",
      },
    ],
    name: "RemoteTokenMessengerAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint32",
        name: "domain",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "tokenMessenger",
        type: "bytes32",
      },
    ],
    name: "RemoteTokenMessengerRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "newRescuer",
        type: "address",
      },
    ],
    name: "RescuerChanged",
    type: "event",
  },
  {
    inputs: [],
    name: "acceptOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "newLocalMinter", type: "address" },
    ],
    name: "addLocalMinter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint32", name: "domain", type: "uint32" },
      { internalType: "bytes32", name: "tokenMessenger", type: "bytes32" },
    ],
    name: "addRemoteTokenMessenger",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint32", name: "destinationDomain", type: "uint32" },
      { internalType: "bytes32", name: "mintRecipient", type: "bytes32" },
      { internalType: "address", name: "burnToken", type: "address" },
    ],
    name: "depositForBurn",
    outputs: [{ internalType: "uint64", name: "_nonce", type: "uint64" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint32", name: "destinationDomain", type: "uint32" },
      { internalType: "bytes32", name: "mintRecipient", type: "bytes32" },
      { internalType: "address", name: "burnToken", type: "address" },
      { internalType: "bytes32", name: "destinationCaller", type: "bytes32" },
      { internalType: "uint256", name: "maxFee", type: "uint256" },
      { internalType: "uint32", name: "minFinalityThreshold", type: "uint32" },
    ],
    name: "depositForBurn",
    outputs: [{ internalType: "uint64", name: "_nonce", type: "uint64" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint32", name: "destinationDomain", type: "uint32" },
      { internalType: "bytes32", name: "mintRecipient", type: "bytes32" },
      { internalType: "address", name: "burnToken", type: "address" },
      { internalType: "bytes32", name: "destinationCaller", type: "bytes32" },
    ],
    name: "depositForBurnWithCaller",
    outputs: [{ internalType: "uint64", name: "nonce", type: "uint64" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint32", name: "remoteDomain", type: "uint32" },
      { internalType: "bytes32", name: "sender", type: "bytes32" },
      { internalType: "bytes", name: "messageBody", type: "bytes" },
    ],
    name: "handleReceiveMessage",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "localMessageTransmitter",
    outputs: [
      {
        internalType: "contract IMessageTransmitter",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "localMinter",
    outputs: [
      { internalType: "contract ITokenMinter", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "messageBodyVersion",
    outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pendingOwner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint32", name: "", type: "uint32" }],
    name: "remoteTokenMessengers",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "removeLocalMinter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint32", name: "domain", type: "uint32" }],
    name: "removeRemoteTokenMessenger",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "originalMessage", type: "bytes" },
      { internalType: "bytes", name: "originalAttestation", type: "bytes" },
      {
        internalType: "bytes32",
        name: "newDestinationCaller",
        type: "bytes32",
      },
      { internalType: "bytes32", name: "newMintRecipient", type: "bytes32" },
    ],
    name: "replaceDepositForBurn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20",
        name: "tokenContract",
        type: "address",
      },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "rescueERC20",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "rescuer",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newRescuer", type: "address" }],
    name: "updateRescuer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function toBytes32(address: string): `0x${string}` {
  return `0x${address.slice(2).padStart(64, "0")}` as `0x${string}`;
}
