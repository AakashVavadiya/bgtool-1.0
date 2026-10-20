export const SITE_URL = process.env["SITE_URL"] || "https://bg.tools";
export const BRAND_NAME = "bg.tools";

export interface PageMetaOptions {
  title: string;
  description: string;
  path: string;
  image?: string | undefined;
  keywords?: string[] | undefined;
  noindex?: boolean | undefined;
  type?: ("website" | "article" | "profile") | undefined;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | undefined;
}

/**
 * Builds standard Google-friendly and social metadata.
 * Preserves high-value target keywords without arbitrary character destruction.
 */
export function buildPageMeta({
  title,
  description,
  path,
  image = `${SITE_URL}/og-image.png`,
  keywords,
  noindex = false,
  type = "website",
  jsonLd,
}: PageMetaOptions) {
  const canonicalUrl = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  
  // Clean, trim whitespace without damaging keywords
  const cleanTitle = title.trim();
  const cleanDescription = description.trim();

  const meta: Array<Record<string, string>> = [
    { title: cleanTitle },
    { name: "description", content: cleanDescription },
    { property: "og:title", content: cleanTitle },
    { property: "og:description", content: cleanDescription },
    { property: "og:url", content: canonicalUrl },
    { property: "og:type", content: type },
    { property: "og:site_name", content: BRAND_NAME },
    { property: "og:image", content: image },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: cleanTitle },
    { name: "twitter:description", content: cleanDescription },
    { name: "twitter:image", content: image },
  ];

  if (keywords && keywords.length > 0) {
    meta.push({ name: "keywords", content: keywords.join(", ") });
  }

  if (noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  } else {
    meta.push({
      name: "robots",
      content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    });
  }

  const links: Array<Record<string, string>> = [
    { rel: "canonical", href: canonicalUrl },
  ];

  const scripts: Array<Record<string, string>> = [];
  if (jsonLd) {
    const list = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    list.forEach((schema) => {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify(schema),
      });
    });
  }

  return { meta, links, scripts };
}

// ─────────────────────────────────────────────────────────────────────────────
// Google Rich Snippet Structured Data (Schema.org) Builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * WebSite Schema with Google Sitelinks SearchBox Action
 */
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_NAME,
    url: SITE_URL,
    description: "Free online AI background removal, image upscaling, compression, and PDF converter tools.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Organization Schema for Entity Trust & Knowledge Panel
 */
export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description: "Privacy-first creative AI utilities, neural matting models, and high-performance image processing tools created by Upanishad.",
    sameAs: [
      "https://github.com/AakashVavadiya",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      url: `${SITE_URL}/contact`,
    },
  };
}

/**
 * BreadcrumbList Schema for Google SERP Hierarchy
 */
export function buildBreadcrumbsSchema(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.path.startsWith("http") ? item.path : `${SITE_URL}${item.path}`,
    })),
  };
}

/**
 * FAQPage Schema for Expandable Rich Snippets in SERP
 */
export function buildFaqSchema(faqs: Array<{ q: string; a: string }>) {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
}

/**
 * HowTo Schema for Step-by-Step Rich Snippets in SERP
 */
export function buildHowToSchema({
  name,
  description,
  steps,
  totalTime = "PT1M",
}: {
  name: string;
  description: string;
  steps: string[];
  totalTime?: string;
}) {
  if (!steps || steps.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use ${name}`,
    description,
    totalTime,
    step: steps.map((s, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: `Step ${idx + 1}`,
      text: s,
    })),
  };
}

