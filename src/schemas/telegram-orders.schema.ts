import { z } from "zod";

// Base order schema with common fields
const baseOrderSchema = z.object({
  user: z.string().min(1, "User ID is required"),
  timestamp: z.string().datetime("Timestamp must be a valid ISO datetime"),
});

// Buy order schema
export const buyOrderSchema = baseOrderSchema.extend({
  type: z.literal("buy"),
  network: z.enum(["ethereum", "base"], {
    errorMap: () => ({
      message: "Network must be either 'ethereum' or 'base'",
    }),
  }),
  amount: z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "Amount must be a valid decimal with up to 2 decimal places"
    ),
});

// Send order schema
export const sendOrderSchema = baseOrderSchema.extend({
  type: z.literal("send"),
  network: z.enum(["ethereum", "base", "arbitrum", "avalanche"], {
    errorMap: () => ({
      message:
        "Network must be one of: 'ethereum', 'base', 'arbitrum', 'avalanche'",
    }),
  }),
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Address must be a valid Ethereum address"),
  amount: z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "Amount must be a valid decimal with up to 2 decimal places"
    ),
});

// Transfer order schema
export const transferOrderSchema = baseOrderSchema.extend({
  type: z.literal("transfer"),
  sourceNetwork: z.enum(["ethereum", "base", "arbitrum", "avalanche"], {
    errorMap: () => ({
      message:
        "Source network must be one of: 'ethereum', 'base', 'arbitrum', 'avalanche'",
    }),
  }),
  destNetwork: z.enum(["ethereum", "base", "arbitrum", "avalanche"], {
    errorMap: () => ({
      message:
        "Destination network must be one of: 'ethereum', 'base', 'arbitrum', 'avalanche'",
    }),
  }),
  amount: z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "Amount must be a valid decimal with up to 2 decimal places"
    ),
});

// Type exports
export type BuyOrder = z.infer<typeof buyOrderSchema>;
export type SendOrder = z.infer<typeof sendOrderSchema>;
export type TransferOrder = z.infer<typeof transferOrderSchema>;
