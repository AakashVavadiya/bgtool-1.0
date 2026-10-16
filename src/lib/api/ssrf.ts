import dns from "dns/promises";
import net from "net";

export interface SafeFetchResult {
  success: boolean;
  buffer?: Buffer;
  contentType?: string;
  sizeBytes?: number;
  error?: string;
}

/**
 * Checks if an IP address belongs to private, loopback, link-local, or reserved ranges.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (!ip) return true;
  const cleanIp = ip.trim();

  // IPv4 check
  if (net.isIPv4(cleanIp)) {
    const parts = cleanIp.split(".").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true;
    const [p0, p1] = parts;

    // 0.0.0.0/8 (Current network)
    if (p0 === 0) return true;
    // 10.0.0.0/8 (Private network)
    if (p0 === 10) return true;
    // 127.0.0.0/8 (Loopback)
    if (p0 === 127) return true;
    // 169.254.0.0/16 (Link-local)
    if (p0 === 169 && p1 === 254) return true;
    // 172.16.0.0/12 (Private network: 172.16.0.0 – 172.31.255.255)
    if (p0 === 172 && p1 !== undefined && p1 >= 16 && p1 <= 31) return true;
    // 192.168.0.0/16 (Private network)
    if (p0 === 192 && p1 === 168) return true;
    // 100.64.0.0/10 (Shared address space / Carrier-grade NAT)
    if (p0 === 100 && p1 !== undefined && p1 >= 64 && p1 <= 127) return true;
    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (p0 === 192 && p1 === 0 && parts[2] === 0) return true;
    // 198.18.0.0/15 (Benchmarking)
    if (p0 === 198 && p1 !== undefined && (p1 === 18 || p1 === 19)) return true;
    // 224.0.0.0/4 (Multicast)
    if (p0 !== undefined && p0 >= 224 && p0 <= 239) return true;
    // 240.0.0.0/4 (Reserved for future use / Broadcast)
    if (p0 !== undefined && p0 >= 240) return true;

    return false;
  }

  // IPv6 check
  if (net.isIPv6(cleanIp)) {
    const lower = cleanIp.toLowerCase();
    // Loopback
    if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
    // Unspecified
    if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return true;
    // IPv4-mapped IPv6 (::ffff:127.0.0.1, etc.)
    if (lower.startsWith("::ffff:")) {
      const v4Part = lower.replace("::ffff:", "");
      return isPrivateOrReservedIp(v4Part);
    }
    // Unique Local Address (fc00::/7 -> fc00:: to fdff::)
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    // Link-local Address (fe80::/10)
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
    // Multicast (ff00::/8)
    if (lower.startsWith("ff")) return true;

    return false;
  }

  return true;
}

/**
 * Validates a target URL against SSRF attacks.
 * Resolves DNS to check all underlying IP addresses.
 */
export async function validateSsrfTargetUrl(inputUrl: string): Promise<{ valid: boolean; error?: string; url?: URL }> {
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    return { valid: false, error: "Invalid URL provided." };
  }

  // 1. HTTPS only
  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Only secure HTTPS URLs are permitted for image_url." };
  }

  // 2. Reject internal / local hostnames
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    hostname.endsWith(".home") ||
    hostname.endsWith(".test")
  ) {
    return { valid: false, error: "Access to internal domain names is prohibited." };
  }

  // 3. Reject credentials in URL
  if (parsed.username || parsed.password) {
    return { valid: false, error: "Credentials in URL are not allowed." };
  }

  // 4. If hostname is a raw IP literal, check immediately
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      return { valid: false, error: "Access to private or loopback IP ranges is prohibited." };
    }
    return { valid: true, url: parsed };
  }

  // 5. DNS Resolution check (check all addresses returned)
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { valid: false, error: "Could not resolve hostname via DNS." };
    }

    for (const addr of addresses) {
      if (isPrivateOrReservedIp(addr.address)) {
        return { valid: false, error: "Host resolves to a restricted private or internal IP address." };
      }
    }
  } catch (err: any) {
    return { valid: false, error: `DNS resolution failed: ${err?.message || "Unknown error"}` };
  }

  return { valid: true, url: parsed };
}

/**
 * Fetches an image from a remote URL with full SSRF protection, size caps, and timeout.
 */
export async function fetchImageWithSsrfProtection(
  imageUrl: string,
  maxSizeBytes = 30 * 1024 * 1024,
  timeoutMs = 8000
): Promise<SafeFetchResult> {
  let currentUrl = imageUrl;
  const maxRedirects = 3;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
    const validation = await validateSsrfTargetUrl(currentUrl);
    if (!validation.valid || !validation.url) {
      return { success: false, error: validation.error || "SSRF validation failed" };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        method: "GET",
        headers: {
          "User-Agent": "bg.tools-API-Bot/1.0 (+https://bg.tools/docs/api)",
          Accept: "image/png, image/jpeg, image/webp, image/*",
        },
        redirect: "manual", // Do NOT follow redirects automatically to prevent SSRF bypass
        signal: controller.signal,
      });

      // Handle Redirects safely by re-validating the Location header
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          return { success: false, error: "Redirect missing Location header." };
        }
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (!response.ok) {
        return { success: false, error: `Failed to download image: HTTP ${response.status} ${response.statusText}` };
      }

      // Check Content-Length header pre-flight
      const contentLengthHeader = response.headers.get("content-length");
      if (contentLengthHeader) {
        const declared = parseInt(contentLengthHeader, 10);
        if (declared > maxSizeBytes) {
          return {
            success: false,
            error: `Image exceeds maximum allowed size (${Math.round(maxSizeBytes / (1024 * 1024))} MB).`,
          };
        }
      }

      // Stream response with strict byte count cap
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length > maxSizeBytes) {
        return {
          success: false,
          error: `Downloaded image exceeds size limit (${Math.round(maxSizeBytes / (1024 * 1024))} MB).`,
        };
      }

      if (buffer.length === 0) {
        return { success: false, error: "Downloaded image is empty (0 bytes)." };
      }

      const contentType = response.headers.get("content-type") || "image/png";

      return {
        success: true,
        buffer,
        contentType,
        sizeBytes: buffer.length,
      };
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return { success: false, error: `Image download timed out after ${timeoutMs / 1000} seconds.` };
      }
      return { success: false, error: `Network error downloading image: ${err?.message || "Unknown error"}` };
    } finally {
      clearTimeout(timer);
    }
  }

  return { success: false, error: "Too many HTTP redirects." };
}
