import { multicall } from "@wagmi/core";
import { TokenInfo, TokensObject } from "./tokens.mainnet";
import { Address, erc20Abi, zeroAddress } from "viem";
import pMap from "p-map";

import { ETH_MAINNET_TOKENS } from "./tokens.mainnet";
import { ETH_MAINNET_INFO } from "@/lib/config/chain-constants";
import { tokenSelectState } from "@/state/token-select-state";
import { wagmiConfig } from "../config/wagmi";

// Create mutable copies of the token maps
const mutableTokenMaps = {
  [ETH_MAINNET_INFO.id]: { ...ETH_MAINNET_TOKENS },
};

export const buildTokenList = async ({
  userAddress,
}: {
  userAddress?: `0x${string}`;
}) => {
  if (tokenSelectState.isBuildingTokenList) return;
  tokenSelectState.isBuildingTokenList = true;

  try {
    const fetchChainBalances = async (
      chainId: number,
      tokens: TokensObject
    ) => {
      const tokenList = Object.values(tokens);
      const chunkSize = 500;
      const chunks = Array.from(
        { length: Math.ceil(tokenList.length / chunkSize) },
        (_, i) => tokenList.slice(i * chunkSize, (i + 1) * chunkSize)
      );

      // Get native token balance
      const nativeBalance = BigInt(0);

      const processedTokens: { [key: string]: TokenInfo } = {};

      await pMap(
        chunks,
        async (tokenChunk: TokenInfo[]) => {
          const addresses = tokenChunk
            .filter((token) => token.address !== zeroAddress)
            .map((token) => token.address as Address);

          const balances: Record<string, bigint> = {};

          if (userAddress && addresses.length > 0) {
            // Standard EVM chain balance fetching
            const calls = addresses.map(
              (token) =>
                ({
                  chainId,
                  address: token,
                  functionName: "balanceOf",
                  args: [userAddress],
                  abi: erc20Abi,
                }) as const
            );

            const results = await multicall(wagmiConfig, {
              chainId,
              contracts: calls,
            });

            addresses.forEach((address, i) => {
              balances[address.toLowerCase()] = results[i].result ?? BigInt(0);
            });
          }
          tokenChunk.forEach((token) => {
            const tokenId = `${chainId}~${token.address.toLowerCase()}`;
            const isNativeToken = token.address === zeroAddress;

            processedTokens[tokenId] = {
              ...token,
              address: token.address as Address,
              balanceOf: isNativeToken
                ? nativeBalance
                : (balances[token.address.toLowerCase()] ?? BigInt(0)),
            };
          });
        },
        { concurrency: 20 }
      );

      return processedTokens;
    };
    // Process tokens for each supported chain
    const results = await Promise.allSettled([
      fetchChainBalances(
        ETH_MAINNET_INFO.id,
        mutableTokenMaps[ETH_MAINNET_INFO.id]
      ),
    ]);

    // Extract successful results and log errors
    const [ethTokens] = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        // Log the error but return an empty object to avoid breaking the token state
        console.error(
          `Failed to fetch tokens for chain index ${index}:`,
          result.reason
        );
        return {};
      }
    });

    // Update token state
    const newTokens = {
      ...ethTokens,
    };

    tokenSelectState.tokens = {
      ...tokenSelectState.tokens,
      ...newTokens,
    };
  } catch (error) {
    console.error("Error building token list:", error);
  } finally {
    tokenSelectState.isBuildingTokenList = false;
  }
};
