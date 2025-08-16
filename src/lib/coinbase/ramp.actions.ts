"use server";

import {
  coinbaseOfframpActionSchema,
  coinbaseOnrampActionSchema,
} from "@/schemas/coinbase-ramp.schema";
import {
  generateOnrampURL,
  generateOfframpURL,
  generateSessionToken,
} from "./ramp-utils";

import { verifyPrivyToken } from "@/utils/auth";
import { ZSAError, createServerAction } from "zsa";
import { RATE_LIMITS, withRateLimit } from "@/utils/with-rate-limit";

export const generateCoinbaseOnrampURLAction = createServerAction()
  .input(coinbaseOnrampActionSchema)
  .handler(async ({ input }) => {
    return withRateLimit(async () => {
      try {
        await verifyPrivyToken();
        const sessionResult = await generateSessionToken({
          addresses: input.addresses,
          assets: [input.asset],
        });

        const onrampURL = generateOnrampURL({
          asset: input.asset,
          amount: input.amount,
          network: input.network,
          fiatCurrency: input.fiatCurrency,
          redirectUrl: input.redirectUrl,
          sessionToken: sessionResult.sessionToken,
          orgId: "",
        });

        return {
          success: true,
          url: onrampURL,
        };
      } catch (error) {
        throw new ZSAError(
          "ERROR",
          error instanceof Error ? error.message : "Invalid onramp URL format"
        );
      }
    }, RATE_LIMITS.SETTINGS);
  });

export const generateCoinbaseOfframpURLAction = createServerAction()
  .input(coinbaseOfframpActionSchema)
  .handler(async ({ input }) => {
    return withRateLimit(async () => {
      try {
        const sessionResult = await generateSessionToken({
          addresses: input.addresses,
          assets: [input.asset],
        });

        const offrampURL = generateOfframpURL({
          asset: input.asset,
          amount: input.amount,
          network: input.network,
          redirectUrl: input.redirectUrl,
          fiatCurrency: input.fiatCurrency,
          sessionToken: sessionResult.sessionToken,
          orgId: input.orgId,
        });

        return {
          success: true,
          url: offrampURL,
        };
      } catch (error) {
        throw new ZSAError(
          "ERROR",
          error instanceof Error ? error.message : "Invalid offramp URL format"
        );
      }
    }, RATE_LIMITS.SETTINGS);
  });
