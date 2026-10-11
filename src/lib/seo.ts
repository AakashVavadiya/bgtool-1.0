export const SITE_URL = process.env["SITE_URL"] || "https://bg.tools";
export const BRAND_NAME = "bg.tools";

export interface PageMetaOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function buildPageMeta({
  title,
  description,
  path,
  image = `${SITE_URL}/og-image.png`,
  noindex = false,
  jsonLd,
}: PageMetaOptions) {
  const canonicalUrl = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  
  // Truncate title < 60 chars and description < 160 chars if necessary
  const safeTitle = title.length > 60 ? `${title.slice(0, 57)}...` : title;
  const safeDescription = description.length > 160 ? `${description.slice(0, 157)}...` : description;

  const meta: Array<Record<string, string>> = [
    { title: safeTitle },
    { name: "description", content: safeDescription },
    { property: "og:title", content: safeTitle },
    { property: "og:description", content: safeDescription },
    { property: "og:url", content: canonicalUrl },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: BRAND_NAME },
    { property: "og:image", content: image },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: safeTitle },
    { name: "twitter:description", content: safeDescription },
    { name: "twitter:image", content: image },
  ];

  if (noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  } else {
    meta.push({ name: "robots", content: "index, follow" });
  }

  const links: Array<Record<string, string>> = [
    { rel: "canonical", href: canonicalUrl },
  ];

  const scripts: Array<Record<string, string>> = [];
  if (jsonLd) {
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify(jsonLd),
    });
  }

  return { meta, links, scripts };
}
