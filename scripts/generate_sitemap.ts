import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { tools } from "../src/lib/tools";

const BASE_URL = process.env["SITE_URL"] || "https://bg.tools";
const fallbackDate = new Date().toISOString().split("T")[0]!;

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

const staticRoutes = [
  { path: "", changefreq: "daily", priority: "1.0", file: "src/routes/index.tsx" },
  { path: "/tools", changefreq: "daily", priority: "0.9", file: "src/routes/tools.index.tsx" },
  { path: "/pricing", changefreq: "weekly", priority: "0.8", file: "src/routes/pricing.tsx" },
  { path: "/faq", changefreq: "weekly", priority: "0.8", file: "src/routes/faq.tsx" },
  { path: "/models", changefreq: "weekly", priority: "0.8", file: "src/routes/models.tsx" },
  { path: "/contact", changefreq: "monthly", priority: "0.7", file: "src/routes/contact.tsx" },
  { path: "/privacy", changefreq: "monthly", priority: "0.6", file: "src/routes/privacy.tsx" },
  { path: "/terms", changefreq: "monthly", priority: "0.6", file: "src/routes/terms.tsx" },
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

// Add static routes with real git commit dates
for (const route of staticRoutes) {
  const lastmod = getGitLastMod(route.file);
  xml += `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`;
}

// Add all verified public tools
const seenSlugs = new Set<string>();
const toolsFileDate = getGitLastMod("src/lib/tools.ts");

for (const tool of tools) {
  if (!tool.slug || seenSlugs.has(tool.slug)) continue;
  seenSlugs.add(tool.slug);

  xml += `  <url>
    <loc>${BASE_URL}/tools/${tool.slug}</loc>
    <lastmod>${toolsFileDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
}

xml += `</urlset>
`;

const publicDir = path.resolve(process.cwd(), "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, "sitemap.xml"), xml, "utf-8");
console.log(`Generated public/sitemap.xml with ${staticRoutes.length + seenSlugs.size} verified URLs for ${BASE_URL}.`);

// Update robots.txt
const robotsTxt = `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /auth
Disallow: /chat

Sitemap: ${BASE_URL}/sitemap.xml
`;

fs.writeFileSync(path.join(publicDir, "robots.txt"), robotsTxt, "utf-8");
console.log("Updated public/robots.txt with /admin, /api, /auth, /chat disallow rules and Sitemap link.");
