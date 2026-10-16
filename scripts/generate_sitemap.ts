import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { tools } from "../src/lib/tools";

const BASE_URL = (process.env["SITE_URL"] || "https://bg.tools").replace(/\/+$/, "");
const fallbackDate = new Date().toISOString().split("T")[0]!;

// Strict exclusion patterns: NEVER permit admin panel or private portals in the sitemap
const EXCLUDED_PATTERNS = [
  "/admin",
  "admin",
  "/api",
  "/account",
  "/auth",
  "/chat",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

function isSafePublicRoute(routePath: string): boolean {
  const normalized = routePath.toLowerCase();
  for (const pattern of EXCLUDED_PATTERNS) {
    if (normalized.includes(pattern)) {
      return false;
    }
  }
  return true;
}

function getGitLastMod(relativeFile?: string): string {
  if (relativeFile) {
    try {
      const fullPath = path.resolve(process.cwd(), relativeFile);
      if (fs.existsSync(fullPath)) {
        const out = execSync(`git log -1 --format=%cs "${relativeFile}"`, {
          encoding: "utf-8",
          stdio: ["ignore", "pipe", "ignore"],
        }).trim();
        if (out && /^\d{4}-\d{2}-\d{2}$/.test(out)) {
          return out;
        }
      }
    } catch {
      // fallback
    }
  }
  return fallbackDate;
}

// Canonical Public Indexable Routes (strictly excluding /admin and account management)
const staticRoutes = [
  { path: "", changefreq: "daily", priority: "1.0", file: "src/routes/index.tsx" },
  { path: "/tools", changefreq: "daily", priority: "0.9", file: "src/routes/tools.index.tsx" },
  { path: "/pricing", changefreq: "weekly", priority: "0.8", file: "src/routes/pricing.tsx" },
  { path: "/faq", changefreq: "weekly", priority: "0.8", file: "src/routes/faq.tsx" },
  { path: "/download", changefreq: "weekly", priority: "0.8", file: "src/routes/download.tsx" },
  { path: "/models", changefreq: "weekly", priority: "0.8", file: "src/routes/models.tsx" },
  { path: "/contact", changefreq: "monthly", priority: "0.7", file: "src/routes/contact.tsx" },
  { path: "/privacy", changefreq: "monthly", priority: "0.6", file: "src/routes/privacy.tsx" },
  { path: "/terms", changefreq: "monthly", priority: "0.6", file: "src/routes/terms.tsx" },
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

let includedCount = 0;

// 1. Add static public routes with real git commit dates
for (const route of staticRoutes) {
  if (!isSafePublicRoute(route.path)) {
    console.warn(`[Sitemap] Skipped excluded route: ${route.path}`);
    continue;
  }
  const lastmod = getGitLastMod(route.file);
  xml += `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`;
  includedCount++;
}

// 2. Add all verified public tools (ensuring 0 admin tools leak)
const seenSlugs = new Set<string>();
const toolsFileDate = getGitLastMod("src/lib/tools.ts");

for (const tool of tools) {
  if (!tool.slug || seenSlugs.has(tool.slug)) continue;
  seenSlugs.add(tool.slug);

  const toolUrl = `/tools/${tool.slug}`;
  if (!isSafePublicRoute(toolUrl)) {
    console.warn(`[Sitemap] Skipped excluded tool: ${toolUrl}`);
    continue;
  }

  xml += `  <url>
    <loc>${BASE_URL}${toolUrl}</loc>
    <lastmod>${toolsFileDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  includedCount++;
}

xml += `</urlset>
`;

const publicDir = path.resolve(process.cwd(), "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, "sitemap.xml"), xml, "utf-8");
console.log(`Generated public/sitemap.xml with ${includedCount} verified public URLs for ${BASE_URL} (Admin panel strictly excluded).`);

// 3. Update robots.txt with strict security disallows
const robotsTxt = `# robots.txt for https://bg.tools
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /
Allow: /tools/
Allow: /pricing
Allow: /faq
Allow: /models
Allow: /contact
Allow: /privacy
Allow: /terms

# Disallow admin panel and private portals
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /account
Disallow: /auth
Disallow: /chat
Disallow: /login
Disallow: /signup
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /verify-email

# Sitemap location
Sitemap: ${BASE_URL}/sitemap.xml
`;

fs.writeFileSync(path.join(publicDir, "robots.txt"), robotsTxt, "utf-8");
console.log("Updated public/robots.txt with strict /admin and internal route disallow rules.");
