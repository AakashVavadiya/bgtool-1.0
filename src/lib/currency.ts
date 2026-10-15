import { detectUserCountry, findCountryByCode } from "./countries";

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED" | "CAD" | "AUD";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flagCode: string;
  countryName: string;
  // Conversion rate relative to 1 INR (e.g. 1 INR = ~0.0116 USD)
  rateFromINR: number;
  // Decimal places for display
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    flagCode: "in",
    countryName: "India",
    rateFromINR: 1,
    decimals: 0,
  },
  {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    flagCode: "us",
    countryName: "United States",
    rateFromINR: 0.0116, // ~₹86 / $1
    decimals: 2,
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    flagCode: "eu",
    countryName: "Eurozone",
    rateFromINR: 0.0108, // ~₹93 / €1
    decimals: 2,
  },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    flagCode: "gb",
    countryName: "United Kingdom",
    rateFromINR: 0.0091, // ~₹110 / £1
    decimals: 2,
  },
  {
    code: "AED",
    symbol: "AED ",
    name: "UAE Dirham",
    flagCode: "ae",
    countryName: "United Arab Emirates",
    rateFromINR: 0.0427, // ~₹23.4 / 1 AED
    decimals: 2,
  },
  {
    code: "CAD",
    symbol: "C$",
    name: "Canadian Dollar",
    flagCode: "ca",
    countryName: "Canada",
    rateFromINR: 0.0161, // ~₹62 / C$1
    decimals: 2,
  },
  {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    flagCode: "au",
    countryName: "Australia",
    rateFromINR: 0.0179, // ~₹56 / A$1
    decimals: 2,
  },
];

const STORAGE_CURRENCY_KEY = "bg_user_selected_currency";
export const CURRENCY_CHANGED_EVENT = "bg_currency_changed";

/**
 * Get active website currency. Checks localStorage, then detects based on user's region
 */
export function getCurrentCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "INR";

  try {
    const stored = localStorage.getItem(STORAGE_CURRENCY_KEY);
    if (stored && SUPPORTED_CURRENCIES.some((c) => c.code === stored)) {
      return stored as CurrencyCode;
    }
    // Auto-detect based on user's country
    const country = detectUserCountry();
    if (country?.defaultCurrency) {
      return country.defaultCurrency;
    }
  } catch {}

  return "INR";
}

/**
 * Switch website currency manually and broadcast update across the entire app
 */
export function setCurrency(code: CurrencyCode): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_CURRENCY_KEY, code);
    window.dispatchEvent(new CustomEvent(CURRENCY_CHANGED_EVENT, { detail: { currency: code } }));
  } catch {}
}

export const setSavedCurrency = setCurrency;

/**
 * Converts an INR amount to target currency
 */
export function convertInrToCurrency(amountINR: number, targetCurrency: CurrencyCode = "INR"): number {
  if (targetCurrency === "INR") return amountINR;
  const config = SUPPORTED_CURRENCIES.find((c) => c.code === targetCurrency);
  if (!config) return amountINR;

  const raw = amountINR * config.rateFromINR;
  // If amount is small (under 10), keep 2 decimals, else round to clean number or .99
  if (raw < 10) {
    return Math.round(raw * 100) / 100;
  }
  return Math.round(raw);
}

/**
 * Format an INR amount in the specified or current active currency
 */
export function formatCurrency(amountINR: number, targetCurrency?: CurrencyCode): string {
  const currencyCode = targetCurrency || (typeof window !== "undefined" ? getCurrentCurrency() : "INR");
  const config = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) || SUPPORTED_CURRENCIES[0]!;

  if (currencyCode === "INR") {
    return `₹${amountINR.toLocaleString("en-IN")}`;
  }

  const converted = convertInrToCurrency(amountINR, currencyCode);
  
  if (config.decimals === 0 || Number.isInteger(converted)) {
    return `${config.symbol}${converted.toLocaleString("en-US")}`;
  }
  return `${config.symbol}${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Return currency config object
 */
export function getCurrencyConfig(code: CurrencyCode): CurrencyConfig {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code) || SUPPORTED_CURRENCIES[0]!;
}
