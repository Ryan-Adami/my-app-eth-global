export const SITE_NAME = "My App";
export const SITE_DESCRIPTION = "My App";
export const NEXT_PUBLIC_SITE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}`;

export const SITE_DOMAIN = new URL(NEXT_PUBLIC_SITE_URL).hostname;
