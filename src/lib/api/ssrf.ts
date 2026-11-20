import dns from "dns/promises";
import net from "net";
import https from "https";
import { inspectImageSafety } from "./image-safety";

export interface SafeFetchResult {
  success: boolean;
  buffer?: Buffer;
  contentType?: string;
  sizeBytes?: number;
  error?: string;
}

/**
 * Checks if an IP address belongs to private, loopback, link-local, multicast, or reserved ranges.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (!ip) return true;
  const cleanIp = ip.trim();

  // IPv4 check
  if (net.isIPv4(cleanIp)) {
    const parts = cleanIp.split(".").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true;
    const [p0, p1, p2] = parts;

    // 0.0.0.0/8 (Current network / "this" network)
    if (p0 === 0) return true;
    // 10.0.0.0/8 (Private network)
    if (p0 === 10) return true;
    // 127.0.0.0/8 (Loopback)
    if (p0 === 127) return true;
    // 169.254.0.0/16 (Link-local, including 169.254.169.254 AWS/GCP/Azure metadata)
    if (p0 === 169 && p1 === 254) return true;
    // 172.16.0.0/12 (Private network: 172.16.0.0 – 172.31.255.255)
    if (p0 === 172 && p1 !== undefined && p1 >= 16 && p1 <= 31) return true;
    // 192.168.0.0/16 (Private network)
    if (p0 === 192 && p1 === 168) return true;
    // 100.64.0.0/10 (Shared address space / Carrier-grade NAT)
    if (p0 === 100 && p1 !== undefined && p1 >= 64 && p1 <= 127) return true;
    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (p0 === 192 && p1 === 0 && p2 === 0) return true;
    // 198.18.0.0/15 (Benchmarking)
    if (p0 === 198 && p1 !== undefined && (p1 === 18 || p1 === 19)) return true;
    // 224.0.0.0/4 (Multicast: 224.0.0.0 - 239.255.255.255)
    if (p0 !== undefined && p0 >= 224 && p0 <= 239) return true;
    // 240.0.0.0/4 (Reserved for future use / Broadcast: 240.0.0.0 - 255.255.255.255)
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
    // IPv4-mapped IPv6 (::ffff:127.0.0.1, ::ffff:10.0.0.1, etc.)
    if (lower.startsWith("::ffff:")) {
      const v4Part = lower.replace("::ffff:", "");
      return isPrivateOrReservedIp(v4Part);
    }
    // Unique Local Address (fc00::/7 -> fc00:: to fdff::)
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    // Link-local Address (fe80::/10 -> fe80:: to febf::)
    if (
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb")
    ) {
      return true;
    }
    // Multicast (ff00::/8)
    if (lower.startsWith("ff")) return true;

    return false;
  }

  return true;
}

export interface SsrfValidationResult {
  valid: boolean;
  error?: string | undefined;
  url?: URL | undefined;
  resolvedIp?: string | undefined;
}

/**
 * Validates target URL against SSRF attacks:
 * - Requires HTTPS protocol
 * - Prohibits credentials in URL
 * - Prohibits non-standard ports (only 443 permitted)
 * - Prohibits internal hostnames (.local, .internal, localhost, etc.)
 * - Resolves all DNS records and rejects any private/reserved/loopback/link-local/multicast IP
 */
export async function validateSsrfTargetUrl(inputUrl: string): Promise<SsrfValidationResult> {
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

  // 2. Reject credentials in URL
  if (parsed.username || parsed.password) {
    return { valid: false, error: "Credentials in URL are not allowed." };
  }

  // 3. Reject non-standard ports (HTTPS standard port 443 only)
  if (parsed.port && parsed.port !== "" && parsed.port !== "443") {
    return { valid: false, error: `Non-standard port (${parsed.port}) is not permitted. Only standard HTTPS (443) is allowed.` };
  }

  // 4. Reject internal / local hostnames
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    hostname.endsWith(".home") ||
    hostname.endsWith(".test") ||
    hostname.endsWith(".corp") ||
    hostname.endsWith(".onion")
  ) {
    return { valid: false, error: "Access to internal domain names is prohibited." };
  }

  // 5. If hostname is already a raw IP literal, check immediately
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      return { valid: false, error: "Access to private, loopback, link-local, or reserved IP ranges is prohibited." };
    }
    return { valid: true, url: parsed, resolvedIp: hostname };
  }

  // 6. DNS Resolution check (check all addresses returned)
  let addresses: Array<{ address: string; family: number }> = [];
  try {
    addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { valid: false, error: "Could not resolve hostname via DNS." };
    }
  } catch (err: any) {
    return { valid: false, error: `DNS resolution failed: ${err?.message || "Unknown error"}` };
  }

  for (const addr of addresses) {
    if (isPrivateOrReservedIp(addr.address)) {
      return { valid: false, error: "Host resolves to a restricted private or internal IP address." };
    }
  }

  const firstAddress = addresses[0]?.address;
  if (!firstAddress) {
    return { valid: false, error: "Could not resolve hostname via DNS." };
  }

  return { valid: true, url: parsed, resolvedIp: firstAddress };
}

/**
 * Downloads a remote image securely:
 * - Pin connection to validated IP to prevent DNS rebinding (TOCTOU)
 * - Strict 10-second timeout
 * - Streamed download with hard 30 MB cutoff (aborts early on oversized payloads)
 * - Re-validates on every HTTP redirect (max 3 redirects)
 * - Validates Content-Type header and image magic bytes
 */
export async function fetchImageWithSsrfProtection(
  imageUrl: string,
  maxSizeBytes = 30 * 1024 * 1024,
  timeoutMs = 10000
): Promise<SafeFetchResult> {
  let currentUrl = imageUrl;
  const maxRedirects = 3;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
    const validation = await validateSsrfTargetUrl(currentUrl);
    if (!validation.valid || !validation.url || !validation.resolvedIp) {
      return { success: false, error: validation.error || "SSRF validation failed." };
    }

    const parsed = validation.url;
    const targetIp = validation.resolvedIp;

    try {
      const result = await new Promise<SafeFetchResult>((resolve) => {
        let isDone = false;
        let totalBytes = 0;
        const chunks: Buffer[] = [];

        const finish = (res: SafeFetchResult) => {
          if (!isDone) {
            isDone = true;
            resolve(res);
          }
        };

        const timer = setTimeout(() => {
          req.destroy(new Error(`Image download timed out after ${timeoutMs / 1000} seconds.`));
          finish({ success: false, error: `Image download timed out after ${timeoutMs / 1000} seconds.` });
        }, timeoutMs);

        // Connect directly to the validated IP (prevents DNS rebinding)
        // Set servername for TLS SNI certificate verification
        const req = https.request(
          {
            host: targetIp,
            port: 443,
            path: `${parsed.pathname}${parsed.search}`,
            method: "GET",
            headers: {
              Host: parsed.host,
              "User-Agent": "bg.tools-API-Bot/1.0 (+https://bg.tools/docs/api)",
              Accept: "image/png, image/jpeg, image/webp, image/*",
            },
            servername: parsed.hostname,
            timeout: timeoutMs,
          },
          (res) => {
            // Handle redirects safely by re-validating the Location header
            if ([301, 302, 303, 307, 308].includes(res.statusCode || 0)) {
              clearTimeout(timer);
              req.destroy();
              const location = res.headers["location"];
              if (!location) {
                return finish({ success: false, error: "Redirect response missing Location header." });
              }
              try {
                const nextUrl = new URL(location, currentUrl).toString();
                return finish({ success: false, error: `__REDIRECT__:${nextUrl}` });
              } catch {
                return finish({ success: false, error: "Malformed redirect Location header." });
              }
            }

            if ((res.statusCode || 0) < 200 || (res.statusCode || 0) >= 300) {
              clearTimeout(timer);
              req.destroy();
              return finish({ success: false, error: `Failed to download image: HTTP ${res.statusCode}` });
            }

            // Verify Content-Type is image/*
            const contentType = (res.headers["content-type"] || "").toLowerCase();
            if (!contentType.startsWith("image/")) {
              clearTimeout(timer);
              req.destroy();
              return finish({
                success: false,
                error: `Invalid content type '${contentType}'. Only image/* resources are permitted.`,
              });
            }

            // Pre-check Content-Length header
            const declaredLenHeader = res.headers["content-length"];
            if (declaredLenHeader) {
              const declared = parseInt(declaredLenHeader, 10);
              if (declared > maxSizeBytes) {
                clearTimeout(timer);
                req.destroy();
                return finish({
                  success: false,
                  error: `Image exceeds maximum allowed size (${Math.round(maxSizeBytes / (1024 * 1024))} MB).`,
                });
              }
            }

            // Stream response chunks with real-time byte cutoff
            res.on("data", (chunk: Buffer) => {
              totalBytes += chunk.length;
              if (totalBytes > maxSizeBytes) {
                clearTimeout(timer);
                req.destroy(new Error("Stream exceeded max size"));
                return finish({
                  success: false,
                  error: `Downloaded image exceeds size limit (${Math.round(maxSizeBytes / (1024 * 1024))} MB).`,
                });
              }
              chunks.push(chunk);
            });

            res.on("end", () => {
              clearTimeout(timer);
              if (chunks.length === 0 || totalBytes === 0) {
                return finish({ success: false, error: "Downloaded image is empty (0 bytes)." });
              }

              const buffer = Buffer.concat(chunks);

              // Verify image magic bytes & decompression bomb
              const safety = inspectImageSafety(buffer);
              if (!safety.safe) {
                return finish({ success: false, error: safety.error || "Downloaded file failed safety inspection." });
              }

              return finish({
                success: true,
                buffer,
                contentType: safety.mime || contentType || "image/png",
                sizeBytes: buffer.length,
              });
            });

            res.on("error", (err) => {
              clearTimeout(timer);
              return finish({ success: false, error: `Network error downloading image: ${err.message}` });
            });
          }
        );

        req.on("error", (err) => {
          clearTimeout(timer);
          return finish({ success: false, error: `Network connection failed: ${err.message}` });
        });

        req.on("timeout", () => {
          clearTimeout(timer);
          req.destroy();
          return finish({ success: false, error: `Image download timed out after ${timeoutMs / 1000} seconds.` });
        });

        req.end();
      });

      // Handle redirect chain
      if (!result.success && result.error?.startsWith("__REDIRECT__:")) {
        currentUrl = result.error.replace("__REDIRECT__:", "");
        continue;
      }

      return result;
    } catch (err: any) {
      return { success: false, error: `Error downloading image: ${err?.message || "Unknown error"}` };
    }
  }

  return { success: false, error: "Too many HTTP redirects." };
}
