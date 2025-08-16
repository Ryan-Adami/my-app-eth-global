import { cookies } from "next/headers";
import { cache } from "react";
import { PrivyClient } from "@privy-io/server-auth";

export const verifyPrivyToken = cache(async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("privy-token")?.value;
  if (!accessToken) {
    return null;
  }
  if (!process.env.PRIVY_APP_ID || !process.env.PRIVY_APP_SECRET) {
    throw new Error("PRIVY_APP_ID or PRIVY_APP_SECRET is not set");
  }
  const privy = new PrivyClient(
    process.env.PRIVY_APP_ID,
    process.env.PRIVY_APP_SECRET
  );

  try {
    const verifiedClaims = await privy.verifyAuthToken(accessToken);
    console.log("verifiedClaims", verifiedClaims);
  } catch (error) {
    console.error(error);
  }
});
