// Real-time Geolocation & Visitor Location Resolver
// Provides accurate mapping from HTTP proxy headers (Cloudflare, Vercel, AWS),
// client IANA timezones, locales, and IP headers to ISO country names and flag emojis.

export interface GeoLocation {
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2
  flag: string;
}

// ISO Alpha-2 Country Code Dictionary with Flags and Official Names
const COUNTRY_CODES: Record<string, { country: string; flag: string }> = {
  IN: { country: "India", flag: "🇮🇳" },
  US: { country: "United States", flag: "🇺🇸" },
  GB: { country: "United Kingdom", flag: "🇬🇧" },
  AT: { country: "Austria", flag: "🇦🇹" },
  BD: { country: "Bangladesh", flag: "🇧🇩" },
  CA: { country: "Canada", flag: "🇨🇦" },
  IL: { country: "Israel", flag: "🇮🇱" },
  DE: { country: "Germany", flag: "🇩🇪" },
  FR: { country: "France", flag: "🇫🇷" },
  NL: { country: "Netherlands", flag: "🇳🇱" },
  AU: { country: "Australia", flag: "🇦🇺" },
  AE: { country: "United Arab Emirates", flag: "🇦🇪" },
  SG: { country: "Singapore", flag: "🇸🇬" },
  JP: { country: "Japan", flag: "🇯🇵" },
  BR: { country: "Brazil", flag: "🇧🇷" },
  IT: { country: "Italy", flag: "🇮🇹" },
  ES: { country: "Spain", flag: "🇪🇸" },
  CH: { country: "Switzerland", flag: "🇨🇭" },
  SE: { country: "Sweden", flag: "🇸🇪" },
  NO: { country: "Norway", flag: "🇳🇴" },
  DK: { country: "Denmark", flag: "🇩🇰" },
  FI: { country: "Finland", flag: "🇫🇮" },
  IE: { country: "Ireland", flag: "🇮🇪" },
  NZ: { country: "New Zealand", flag: "🇳🇿" },
  PK: { country: "Pakistan", flag: "🇵🇰" },
  NP: { country: "Nepal", flag: "🇳🇵" },
  LK: { country: "Sri Lanka", flag: "🇱🇰" },
  ZA: { country: "South Africa", flag: "🇿🇦" },
  NG: { country: "Nigeria", flag: "🇳🇬" },
  KE: { country: "Kenya", flag: "🇰🇪" },
  EG: { country: "Egypt", flag: "🇪🇬" },
  SA: { country: "Saudi Arabia", flag: "🇸🇦" },
  QA: { country: "Qatar", flag: "🇶🇦" },
  KW: { country: "Kuwait", flag: "🇰🇼" },
  OM: { country: "Oman", flag: "🇴🇲" },
  TR: { country: "Turkey", flag: "🇹🇷" },
  RU: { country: "Russia", flag: "🇷🇺" },
  UA: { country: "Ukraine", flag: "🇺🇦" },
  PL: { country: "Poland", flag: "🇵🇱" },
  CZ: { country: "Czech Republic", flag: "🇨🇿" },
  BE: { country: "Belgium", flag: "🇧🇪" },
  PT: { country: "Portugal", flag: "🇵🇹" },
  GR: { country: "Greece", flag: "🇬🇷" },
  MX: { country: "Mexico", flag: "🇲🇽" },
  AR: { country: "Argentina", flag: "🇦🇷" },
  CL: { country: "Chile", flag: "🇨🇱" },
  CO: { country: "Colombia", flag: "🇨🇴" },
  ID: { country: "Indonesia", flag: "🇮🇩" },
  MY: { country: "Malaysia", flag: "🇲🇾" },
  TH: { country: "Thailand", flag: "🇹🇭" },
  VN: { country: "Vietnam", flag: "🇻🇳" },
  PH: { country: "Philippines", flag: "🇵🇭" },
  KR: { country: "South Korea", flag: "🇰🇷" },
  HK: { country: "Hong Kong", flag: "🇭🇰" },
  TW: { country: "Taiwan", flag: "🇹🇼" },
};

// Common IANA Timezone to Country Code Mapping
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  // India
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",

  // United States
  "America/New_York": "US",
  "America/Detroit": "US",
  "America/Kentucky/Louisville": "US",
  "America/Kentucky/Monticello": "US",
  "America/Indiana/Indianapolis": "US",
  "America/Indiana/Vincennes": "US",
  "America/Indiana/Winamac": "US",
  "America/Indiana/Marengo": "US",
  "America/Indiana/Petersburg": "US",
  "America/Indiana/Vevay": "US",
  "America/Chicago": "US",
  "America/Indiana/Tell_City": "US",
  "America/Indiana/Knox": "US",
  "America/Menominee": "US",
  "America/North_Dakota/Center": "US",
  "America/North_Dakota/New_Salem": "US",
  "America/North_Dakota/Beulah": "US",
  "America/Denver": "US",
  "America/Boise": "US",
  "America/Phoenix": "US",
  "America/Los_Angeles": "US",
  "America/Anchorage": "US",
  "America/Juneau": "US",
  "America/Sitka": "US",
  "America/Metlakatla": "US",
  "America/Yakutat": "US",
  "America/Nome": "US",
  "America/Adak": "US",
  "Pacific/Honolulu": "US",

  // United Kingdom
  "Europe/London": "GB",
  "Europe/Belfast": "GB",

  // Austria
  "Europe/Vienna": "AT",

  // Bangladesh
  "Asia/Dhaka": "BD",
  "Asia/Dacca": "BD",

  // Canada
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Halifax": "CA",
  "America/St_Johns": "CA",
  "America/Regina": "CA",
  "America/Montreal": "CA",
  "America/Calgary": "CA",
  "America/Ottawa": "CA",

  // Israel
  "Asia/Jerusalem": "IL",
  "Asia/Tel_Aviv": "IL",

  // Germany
  "Europe/Berlin": "DE",
  "Europe/Busingen": "DE",

  // France
  "Europe/Paris": "FR",

  // Netherlands
  "Europe/Amsterdam": "NL",

  // Australia
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Perth": "AU",
  "Australia/Adelaide": "AU",
  "Australia/Hobart": "AU",
  "Australia/Darwin": "AU",

  // UAE
  "Asia/Dubai": "AE",

  // Singapore
  "Asia/Singapore": "SG",

  // Japan
  "Asia/Tokyo": "JP",

  // Brazil
  "America/Sao_Paulo": "BR",
  "America/Rio_Branco": "BR",
  "America/Manaus": "BR",
  "America/Fortaleza": "BR",

  // Others
  "Europe/Rome": "IT",
  "Europe/Madrid": "ES",
  "Europe/Zurich": "CH",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI",
  "Europe/Dublin": "IE",
  "Pacific/Auckland": "NZ",
  "Asia/Karachi": "PK",
  "Asia/Kathmandu": "NP",
  "Asia/Colombo": "LK",
  "Africa/Johannesburg": "ZA",
  "Africa/Lagos": "NG",
  "Africa/Nairobi": "KE",
  "Africa/Cairo": "EG",
  "Asia/Riyadh": "SA",
  "Asia/Qatar": "QA",
  "Asia/Kuwait": "KW",
  "Europe/Istanbul": "TR",
  "Europe/Moscow": "RU",
  "Europe/Kyiv": "UA",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Brussels": "BE",
  "Europe/Lisbon": "PT",
  "Europe/Athens": "GR",
  "America/Mexico_City": "MX",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Santiago": "CL",
  "America/Bogota": "CO",
  "Asia/Jakarta": "ID",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Bangkok": "TH",
  "Asia/Ho_Chi_Minh": "VN",
  "Asia/Manila": "PH",
  "Asia/Seoul": "KR",
  "Asia/Hong_Kong": "HK",
  "Asia/Taipei": "TW",
};

/**
 * Resolves geolocation into country, ISO country code, and emoji flag.
 */
export function resolveGeo(
  headers?: Record<string, string | null | undefined> | Headers | null,
  clientData?: { timezone?: string | undefined; language?: string | undefined; ip?: string | undefined }
): GeoLocation {
  // 1. Check direct Cloudflare / Proxy headers
  let cfCountry: string | null = null;

  if (headers) {
    if (typeof (headers as Headers).get === "function") {
      const h = headers as Headers;
      cfCountry =
        h.get("cf-ipcountry") ||
        h.get("x-country-code") ||
        h.get("x-vercel-ip-country") ||
        h.get("cloudfront-viewer-country") ||
        null;
    } else {
      const obj = headers as Record<string, string | null | undefined>;
      cfCountry =
        obj["cf-ipcountry"] ||
        obj["CF-IPCountry"] ||
        obj["x-country-code"] ||
        obj["x-vercel-ip-country"] ||
        obj["cloudfront-viewer-country"] ||
        null;
    }
  }

  if (cfCountry && cfCountry.length === 2 && cfCountry !== "XX" && cfCountry !== "T1") {
    const code = cfCountry.toUpperCase();
    const entry = COUNTRY_CODES[code];
    if (entry) {
      return {
        country: entry.country,
        countryCode: code,
        flag: entry.flag,
      };
    }
    // Generate regional indicator flag for unknown alpha-2
    const flag = code
      .toUpperCase()
      .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
    return {
      country: code,
      countryCode: code,
      flag,
    };
  }

  // 2. Check Client IANA Timezone mapping
  const tz = clientData?.timezone || "";
  if (tz) {
    if (TIMEZONE_TO_COUNTRY[tz]) {
      const code = TIMEZONE_TO_COUNTRY[tz]!;
      const entry = COUNTRY_CODES[code];
      if (entry) {
        return {
          country: entry.country,
          countryCode: code,
          flag: entry.flag,
        };
      }
    }

    // Pattern matching on timezone prefix/suffix
    if (tz.includes("Kolkata") || tz.includes("Calcutta") || tz.includes("India")) {
      return { country: "India", countryCode: "IN", flag: "🇮🇳" };
    }
    if (tz.includes("Vienna") || tz.includes("Austria")) {
      return { country: "Austria", countryCode: "AT", flag: "🇦🇹" };
    }
    if (tz.includes("Dhaka") || tz.includes("Bangladesh")) {
      return { country: "Bangladesh", countryCode: "BD", flag: "🇧🇩" };
    }
    if (
      tz.includes("Toronto") ||
      tz.includes("Vancouver") ||
      tz.includes("Montreal") ||
      tz.includes("Edmonton") ||
      tz.includes("Halifax") ||
      tz.includes("Winnipeg") ||
      tz.includes("Canada")
    ) {
      return { country: "Canada", countryCode: "CA", flag: "🇨🇦" };
    }
    if (tz.includes("Jerusalem") || tz.includes("Tel_Aviv") || tz.includes("Israel")) {
      return { country: "Israel", countryCode: "IL", flag: "🇮🇱" };
    }
    if (tz.includes("London") || tz.includes("Belfast")) {
      return { country: "United Kingdom", countryCode: "GB", flag: "🇬🇧" };
    }
    if (
      tz.includes("New_York") ||
      tz.includes("Chicago") ||
      tz.includes("Los_Angeles") ||
      tz.includes("Denver") ||
      tz.includes("Phoenix") ||
      tz.includes("Anchorage") ||
      tz.includes("Honolulu") ||
      tz.startsWith("US/") ||
      tz.startsWith("America/")
    ) {
      return { country: "United States", countryCode: "US", flag: "🇺🇸" };
    }
    if (tz.includes("Berlin") || tz.includes("Frankfurt") || tz.includes("Munich")) {
      return { country: "Germany", countryCode: "DE", flag: "🇩🇪" };
    }
    if (tz.includes("Paris")) {
      return { country: "France", countryCode: "FR", flag: "🇫🇷" };
    }
    if (tz.includes("Amsterdam")) {
      return { country: "Netherlands", countryCode: "NL", flag: "🇳🇱" };
    }
    if (tz.startsWith("Australia/")) {
      return { country: "Australia", countryCode: "AU", flag: "🇦🇺" };
    }
    if (tz.includes("Dubai")) {
      return { country: "United Arab Emirates", countryCode: "AE", flag: "🇦🇪" };
    }
    if (tz.includes("Singapore")) {
      return { country: "Singapore", countryCode: "SG", flag: "🇸🇬" };
    }
    if (tz.includes("Tokyo")) {
      return { country: "Japan", countryCode: "JP", flag: "🇯🇵" };
    }
  }

  // 3. Fallback to client browser language locale (e.g. en-US -> US, de-AT -> AT, bn-BD -> BD)
  const lang = clientData?.language || "";
  if (lang.includes("-")) {
    const langCode = lang.split("-")[1]?.toUpperCase();
    if (langCode) {
      const entry = COUNTRY_CODES[langCode];
      if (entry) {
        return {
          country: entry.country,
          countryCode: langCode,
          flag: entry.flag,
        };
      }
    }
  }

  // 4. Default fallback: India (Production host primary base)
  return {
    country: "India",
    countryCode: "IN",
    flag: "🇮🇳",
  };
}
