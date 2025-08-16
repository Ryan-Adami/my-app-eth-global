"server-only";

import {
  CoinbaseOfframpURLParams,
  CoinbaseOnrampURLParams,
  CoinbaseSessionTokenParams,
} from "@/schemas/coinbase-ramp.schema";
import { generateJwt } from "@coinbase/cdp-sdk/auth";

/**
 * Generates a JWT token for Coinbase API authentication
 */
export async function generateCoinbaseRampJWT(
  requestPath?: string,
  requestMethod: string = "POST",
  apiKeyId?: string,
  apiKeySecret?: string
): Promise<string> {
  try {
    const token = await generateJwt({
      apiKeyId: apiKeyId || process.env.CDP_API_KEY_NAME || "",
      apiKeySecret: apiKeySecret || process.env.CDP_API_SECRET || "",
      requestMethod,
      requestHost: "api.developer.coinbase.com",
      requestPath: requestPath || "/onramp/v1/token",
      expiresIn: 120,
    });

    return token;
  } catch (error) {
    console.error("Error generating JWT:", error);
    throw error;
  }
}

/**
 * Generates a session token from Coinbase API
 */
export async function generateSessionToken(
  params: CoinbaseSessionTokenParams
): Promise<{ sessionToken: string; channelId?: string }> {
  try {
    const { addresses, assets } = params;

    if (!addresses || addresses.length === 0) {
      throw new Error("Addresses parameter is required");
    }

    let jwtToken: string;
    try {
      jwtToken = await generateCoinbaseRampJWT();
    } catch (error) {
      console.error("JWT generation failed:", error);

      if (
        error instanceof Error &&
        error.message.includes("secretOrPrivateKey")
      ) {
        throw new Error(
          "Invalid private key format. The CDP_API_SECRET should be your EC private key. If you have just the base64 content, ensure it's properly formatted."
        );
      }

      throw new Error(
        `Failed to authenticate with CDP API: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    const cdpApiUrl = "https://api.developer.coinbase.com/onramp/v1/token";

    const requestBody = {
      addresses,
      ...(assets && { assets }),
    };

    console.log("Making request to CDP API:", {
      url: cdpApiUrl,
      addressCount: addresses.length,
      hasAssets: !!assets,
    });

    const response = await fetch(cdpApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("CDP API error:", response.status, response.statusText);
      console.error("Response body:", responseText);

      let errorDetails;
      try {
        errorDetails = JSON.parse(responseText);
      } catch {
        errorDetails = responseText;
      }

      // Provide helpful error messages based on status code
      if (response.status === 401) {
        throw new Error(
          "Authentication failed. Please verify your CDP API key and secret are correct. The API key should be in the format: organizations/{org_id}/apiKeys/{key_id}"
        );
      }

      throw new Error(
        `CDP API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetails)}`
      );
    }

    // Parse successful response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse response:", responseText);
      throw new Error(`Invalid response from CDP API: ${responseText}`);
    }

    return {
      sessionToken: data.token,
      channelId: data.channelId || data.channel_id,
    };
  } catch (error) {
    console.error("Error generating session token:", error);
    throw error;
  }
}

/**
 * Generates a Coinbase Onramp URL with the provided parameters
 */
export function generateOnrampURL(params: CoinbaseOnrampURLParams): string {
  const {
    asset,
    amount,
    network,
    fiatCurrency,
    orgId,
    redirectUrl,
    sessionToken,
  } = params;

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) {
    throw new Error("Invalid amount provided");
  }

  const baseUrl = "https://pay.coinbase.com/buy/select-asset";

  const queryParams = new URLSearchParams();

  queryParams.append("sessionToken", sessionToken);

  if (asset) queryParams.append("defaultAsset", asset);
  if (network) queryParams.append("defaultNetwork", network);
  if (numericAmount > 0) {
    queryParams.append("presetCryptoAmount", numericAmount.toString());
  }
  if (fiatCurrency) {
    queryParams.append("fiatCurrency", fiatCurrency);
  }
  queryParams.append("partnerUserId", orgId);
  if (redirectUrl) {
    queryParams.append("redirectUrl", redirectUrl);
  }

  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Generates a Coinbase Offramp URL with the provided parameters
 */
export function generateOfframpURL(params: CoinbaseOfframpURLParams): string {
  const { asset, amount, network, orgId, redirectUrl, sessionToken } = params;

  const baseUrl = "https://pay.coinbase.com/v3/sell/input";

  const queryParams = new URLSearchParams();

  queryParams.append("sessionToken", sessionToken);

  if (asset) queryParams.append("defaultAsset", asset);
  if (network) queryParams.append("defaultNetwork", network);

  const numericAmount = parseFloat(amount);
  if (!isNaN(numericAmount) && numericAmount > 0) {
    queryParams.append("presetCryptoAmount", numericAmount.toString());
  }

  queryParams.append("partnerUserId", orgId);

  if (redirectUrl) {
    queryParams.append("redirectUrl", redirectUrl);
  }

  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Generates a transaction status URL for checking the status of a transaction
 */
export function generateTransactionStatusURL(transactionId: string): string {
  return `https://pay.coinbase.com/api/v1/transactions/${transactionId}`;
}

/**
 * Get onramp transactions by ID
 */
export async function getOnrampTransactionsById(
  orgId: string,
  pageKey?: string,
  pageSize?: number,
  apiKeyId?: string,
  apiKeySecret?: string
): Promise<OnrampTransactionsResponse> {
  try {
    const jwtToken = await generateCoinbaseRampJWT(
      `/onramp/v1/buy/user/${orgId}/transactions`,
      "GET",
      apiKeyId,
      apiKeySecret
    );

    const baseUrl = `https://api.developer.coinbase.com/onramp/v1/buy/user/${orgId}/transactions`;

    const queryParams = new URLSearchParams();

    if (pageKey) queryParams.append("pageKey", pageKey.toString());
    if (pageSize) queryParams.append("pageSize", pageSize.toString());

    const response = await fetch(`${baseUrl}?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `CDP API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as OnrampTransactionsResponse;
    return data;
  } catch (error) {
    console.error("Error fetching onramp transactions:", error);
    throw error;
  }
}

/**
 * Response type for getOnrampTransactionsById function
 */
export interface OnrampTransactionsResponse {
  nextPageKey: string;
  totalCount: number;
  transactions: {
    coinbase_fee: { currency: string; value: string } | null;
    completed_at?: string;
    contract_address?: string;
    country?: string;
    created_at: string;
    end_partner_name: string;
    exchange_rate: { value: string; currency: string };
    failure_reason?:
      | "FAILURE_REASON_BUY_FAILED"
      | "FAILURE_REASON_SEND_FAILED"
      | "FAILURE_REASON_UNSPECIFIED";
    network_fee: { value: string; currency: string };
    partner_user_ref: string;
    payment_method:
      | "UNSPECIFIED"
      | "CARD"
      | "ACH_BANK_ACCOUNT"
      | "APPLE_PAY"
      | "FIAT_WALLET"
      | "CRYPTO_ACCOUNT"
      | "GUEST_CHECKOUT_CARD"
      | "PAYPAL"
      | "RTP"
      | "GUEST_CHECKOUT_APPLE_PAY";
    payment_subtotal: { value: string; currency: string };
    payment_total: { value: string; currency: string };
    payment_total_usd: { value: string; currency: string };
    purchase_amount: { value: string; currency: string };
    purchase_currency: string;
    purchase_network: string;
    status:
      | "ONRAMP_TRANSACTION_STATUS_CREATED"
      | "ONRAMP_TRANSACTION_STATUS_IN_PROGRESS"
      | "ONRAMP_TRANSACTION_STATUS_SUCCESS"
      | "ONRAMP_TRANSACTION_STATUS_FAILED";
    transaction_id: string;
    tx_hash?: string;
    type:
      | "ONRAMP_TRANSACTION_TYPE_BUY_AND_SEND"
      | "ONRAMP_TRANSACTION_TYPE_SEND";
    user_id: string;
    user_type: "USER_TYPE_AUTHED" | "USER_TYPE_GUEST";
    wallet_address: string;
  }[];
}
