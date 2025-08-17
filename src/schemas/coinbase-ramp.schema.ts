import { z } from "zod";

export const coinbaseOnrampActionSchema = z.object({
  asset: z.string().min(1, "Asset is required"),
  amount: z.string().min(1, "Amount is required"),
  network: z.string().min(1, "Network is required"),
  fiatCurrency: z.string().min(1, "Fiat currency is required"),
  addresses: z
    .array(
      z.object({
        address: z.string().min(1, "Address is required"),
        blockchains: z
          .array(z.string())
          .min(1, "At least one blockchain is required"),
      })
    )
    .min(1, "At least one address is required"),
  telegramId: z.string().min(1, "Telegram ID is required"),
});

export const coinbaseOnrampURLSchema = z.object({
  asset: z.string().min(1, "Asset is required"),
  amount: z.string().min(1, "Amount is required"),
  network: z.string().min(1, "Network is required"),
  fiatCurrency: z.string().min(1, "Fiat currency is required"),
  telegramId: z.string().min(1, "Telegram ID is required"),
  redirectUrl: z.string().url("Redirect URL must be a valid URL"),
  sessionToken: z.string().min(1, "Session token is required"),
});

export const coinbaseOfframpActionSchema = z.object({
  asset: z.string().min(1, "Asset is required"),
  amount: z.string().min(1, "Amount is required"),
  network: z.string().min(1, "Network is required"),
  address: z.string().min(1, "Address is required"),
  redirectUrl: z.string().url("Redirect URL must be a valid URL"),
  fiatCurrency: z.string().min(1, "Fiat currency is required"),
  telegramId: z.string().min(1, "Org ID is required"),
  addresses: z
    .array(
      z.object({
        address: z.string().min(1, "Address is required"),
        blockchains: z
          .array(z.string())
          .min(1, "At least one blockchain is required"),
      })
    )
    .min(1, "At least one address is required"),
});

export const coinbaseOfframpURLSchema = z.object({
  asset: z.string().min(1, "Asset is required"),
  amount: z.string().min(1, "Amount is required"),
  network: z.string().min(1, "Network is required"),
  telegramId: z.string().min(1, "Org ID is required"),
  redirectUrl: z.string().url("Redirect URL must be a valid URL"),
  fiatCurrency: z.string().min(1, "Fiat currency is required"),
  sessionToken: z.string().min(1, "Session token is required"),
});

export const coinbaseSessionTokenSchema = z.object({
  addresses: z
    .array(
      z.object({
        address: z.string().min(1, "Address is required"),
        blockchains: z
          .array(z.string())
          .min(1, "At least one blockchain is required"),
      })
    )
    .min(1, "At least one address is required"),
  assets: z.array(z.string()).optional(),
});

export type CoinbaseOnrampActionParams = z.infer<
  typeof coinbaseOnrampActionSchema
>;
export type CoinbaseOfframpActionParams = z.infer<
  typeof coinbaseOfframpActionSchema
>;
export type CoinbaseOnrampURLParams = z.infer<typeof coinbaseOnrampURLSchema>;
export type CoinbaseOfframpURLParams = z.infer<typeof coinbaseOfframpURLSchema>;
export type CoinbaseSessionTokenParams = z.infer<
  typeof coinbaseSessionTokenSchema
>;
