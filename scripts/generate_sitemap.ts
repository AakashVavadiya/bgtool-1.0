import fs from "fs";
import path from "path";
import { tools } from "../src/lib/tools";

const BASE_URL = process.env["SITE_URL"] || "https://bgtool.ai";
const today = new Date().toISOString().split("T")[0];

const staticRoutes = [
  { path: "", changefreq: "daily", priority: "1.0" },
  { path: "/tools", changefreq: "daily", priority: "0.9" },
  { path: "/pricing", changefreq: "weekly", priority: "0.8" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/faq", changefreq: "weekly", priority: "0.7" },
  { path: "/privacy", changefreq: "monthly", priority: "0.6" },
  { path: "/terms", changefreq: "monthly", priority: "0.6" },
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

// Add static routes
for (const route of staticRoutes) {
  xml += `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`;
}

// Add all verified public tools
const seenSlugs = new Set<string>();
for (const tool of tools) {
  if (!tool.slug || seenSlugs.has(tool.slug)) continue;
  seenSlugs.add(tool.slug);

  xml += `  <url>
    <loc>${BASE_URL}/tools/${tool.slug}</loc>
    <lastmod>${today}</lastmod>
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
console.log(`Generated public/sitemap.xml with ${staticRoutes.length + seenSlugs.size} verified URLs.`);

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

Sitemap: ${BASE_URL}/sitemap.xml
`;

fs.writeFileSync(path.join(publicDir, "robots.txt"), robotsTxt, "utf-8");
console.log("Updated public/robots.txt with /admin & /api disallow rules and Sitemap link.");
