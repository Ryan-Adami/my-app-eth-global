import { cookies } from "next/headers";
import { cache } from "react";
import { importSPKI, jwtVerify } from "jose";

export const verifyPrivyToken = cache(async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("privy-token")?.value;
  if (!accessToken) {
    return null;
  }
  const verificationKey = await importSPKI(
    "insert-your-privy-verification-key",
    "ES256"
  );
  try {
    const payload = await jwtVerify(accessToken, verificationKey, {
      issuer: "privy.io",
      audience: "insert-your-privy-app-id",
    });
    console.log(payload);
  } catch (error) {
    console.error(error);
  }
});
