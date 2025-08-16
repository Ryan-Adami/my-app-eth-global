import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export interface NumberFormatProps {
  maxValue?: number;
  value?: number | string;
  dataType?: "currency" | "number" | "percent";
  precision?: number;
  minMaxPrecision?: [number, number];
  suffix?: "" | "b" | "k" | "m";
  zeroDisplay?: "-" | "hide";
  signDisplay?: "always" | "auto" | "exceptZero" | "never";
  useGrouping?: boolean;
  threshold?: number;
}

export const isTransactionHash = (value: string) => {
  return /^0x([A-Fa-f0-9]{64})$/.test(value);
};

export const formatNumber = ({
  maxValue: propsMaxValue,
  value,
  dataType,
  minMaxPrecision,
  precision,
  suffix,
  zeroDisplay,
  signDisplay,
  useGrouping = false,
  threshold,
}: NumberFormatProps) => {
  let suffixToUse = suffix;
  let numberValue = +(value ?? 0);
  const maxValue = Math.abs(propsMaxValue ?? numberValue);
  const numberFormatterOptions: Intl.NumberFormatOptions = {};
  let customPrecisionMin;
  let customPrecisionMax;
  if (!minMaxPrecision && !precision) {
    const numDigits =
      numberValue !== 0 ? Math.floor(Math.log10(Math.abs(numberValue))) + 1 : 6;
    customPrecisionMin = 0;
    customPrecisionMax = Math.max(0, 6 - numDigits);
  } else if (minMaxPrecision) {
    customPrecisionMin = minMaxPrecision?.[0];
    customPrecisionMax = minMaxPrecision?.[1];
  } else if (precision) {
    customPrecisionMin = precision;
    customPrecisionMax = precision;
  }

  if (value === 0 && zeroDisplay) {
    return zeroDisplay === "-" ? "-" : "";
  }

  if (signDisplay) {
    numberFormatterOptions.signDisplay = signDisplay;
  }

  if (!useGrouping) {
    numberFormatterOptions.useGrouping = false;
  }

  if (dataType === "percent") {
    numberFormatterOptions.style = "percent";
    numberFormatterOptions.minimumFractionDigits = customPrecisionMin ?? 0;
    numberFormatterOptions.maximumFractionDigits = customPrecisionMax ?? 0;
    suffixToUse = "";
  }

  if (dataType === "currency") {
    numberFormatterOptions.style = "currency";
    numberFormatterOptions.currency = "USD";
  }

  if (suffixToUse === "") {
    numberFormatterOptions.minimumFractionDigits = customPrecisionMin ?? 0;
    numberFormatterOptions.maximumFractionDigits = customPrecisionMax ?? 0;
  } else if (
    (isNullOrWhitespace(suffixToUse) && maxValue > 1_000_000_000) ||
    suffixToUse === "b"
  ) {
    numberValue /= 1_000_000_000;
    suffixToUse = "b";
    numberFormatterOptions.minimumFractionDigits = customPrecisionMin ?? 1;
    numberFormatterOptions.maximumFractionDigits = customPrecisionMax ?? 1;
  } else if (
    (isNullOrWhitespace(suffixToUse) && maxValue > 1_000_000) ||
    suffixToUse === "m"
  ) {
    numberValue /= 1_000_000;
    suffixToUse = "m";
    numberFormatterOptions.minimumFractionDigits = customPrecisionMin ?? 2;
    numberFormatterOptions.maximumFractionDigits = customPrecisionMax ?? 2;
  } else if (
    (isNullOrWhitespace(suffixToUse) && maxValue > 1000) ||
    suffixToUse === "k"
  ) {
    numberValue /= 1000;
    suffixToUse = "k";
    numberFormatterOptions.minimumFractionDigits = customPrecisionMin ?? 2;
    numberFormatterOptions.maximumFractionDigits = customPrecisionMax ?? 2;
  } else if (maxValue < 10 && dataType !== "currency") {
    numberFormatterOptions.minimumFractionDigits = customPrecisionMin ?? 3;
    numberFormatterOptions.maximumFractionDigits = customPrecisionMax ?? 3;
  } else {
    numberFormatterOptions.minimumFractionDigits = customPrecisionMin ?? 2;
    numberFormatterOptions.maximumFractionDigits = customPrecisionMax ?? 2;
  }
  const numberFormatter = new Intl.NumberFormat(
    "en-US",
    numberFormatterOptions
  );
  return threshold !== undefined && numberValue < threshold && numberValue > 0
    ? `< ${numberFormatter.format(threshold)}${suffixToUse ?? ""}`
    : `${numberFormatter.format(numberValue)}${suffixToUse ?? ""}`;
};

export function toBytes32(address: string): `0x${string}` {
  return `0x${address.slice(2).padStart(64, "0")}` as `0x${string}`;
}

export function fromBytes32(bytes32: string): `0x${string}` {
  const withoutPrefix = bytes32.startsWith("0x") ? bytes32.slice(2) : bytes32;
  const withoutLeadingZeros = withoutPrefix.replace(/^0+/, "");
  const padded = withoutLeadingZeros.padStart(40, "0");
  return `0x${padded}` as `0x${string}`;
}

export const isNullOrWhitespace = (input?: string) => {
  if (typeof input === "undefined" || input === null) {
    return true;
  }

  return input.replace(/\s/g, "").length < 1;
};

export const countDecimals = (value: string) => {
  const decimalIndex = value.indexOf(".");
  if (decimalIndex !== -1) {
    return value.length - decimalIndex - 1;
  } else {
    return 0;
  }
};

declare global {
  interface Number {
    toFixedWithTrim(precision: number): string;
  }
}

Number.prototype.toFixedWithTrim = function (precision: number): string {
  // if scientific notation for number greater than 0 (ex. 2e+24), convert to string
  if (Number(this) > 1) {
    return this.toLocaleString("en-US", {
      useGrouping: false,
      maximumFractionDigits: 20,
    });
  } else {
    // if scientific notation for number less than 1 (ex. 2e-12), remove trailing zeros with precision applied
    return this.toFixed(precision)
      .replace(/([^.])0+$/, "$1")
      .replace(/\.0$/, "");
  }
};

export const shortenEthWalletAddress = (
  address: `0x${string}` | string | undefined,
  firstChars: number = 4,
  lastChars: number = 4
) => {
  if (!address) {
    return "";
  }
  if (address.length <= firstChars + lastChars + 2) {
    return address;
  }
  const start = address.slice(0, firstChars + 2);
  const end = address.slice(-lastChars);
  return `${start}...${end}`;
};
