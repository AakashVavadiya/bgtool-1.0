import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getNewsArticles } from "@/lib/news";
import { TOOL_CATEGORIES, getTool, type ToolCategory } from "@/lib/tools";
import { buildPageMeta, SITE_URL } from "@/lib/seo";
import { Search, X, ArrowRight, Newspaper, Clock, BookOpen } from "lucide-react";

export const Route = createFileRoute("/news/")({
  head: () => {
    const articles = getNewsArticles();
    return buildPageMeta({
      title: "News & Guides: Free Online Tool Tutorials & Masterclasses | bg.tools",
      description:
        "In-depth guides for every bg.tools tool: background removal, image compression, PDF and document conversion. Step-by-step tutorials, tips and FAQs.",
      path: "/news",
      keywords: [
        "bg.tools guides",
        "photo editing tutorials",
        "background removal guide",
        "image compression tips",
        "pdf converter tutorials",
      ],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "News & Guides", item: `${SITE_URL}/news` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "bg.tools News & Guides",
          url: `${SITE_URL}/news`,
          description: "Step-by-step tutorials, guides, and practical workflows for 130+ browser tools.",
          mainEntity: {
            "@type": "ItemList",
            itemListElement: articles.slice(0, 50).map((a, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}/news/${a.slug}`,
              name: a.title,
            })),
          },
        },
      ],
    });
  },
  component: NewsIndexPage,
});

function NewsIndexPage() {
  const articles = useMemo(() => getNewsArticles(), []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | ToolCategory>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (category !== "All" && a.category !== category) return false;
      if (!q) return true;
      return (
        a.toolName.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [articles, query, category]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <SiteHeader />

        <main className="w-full px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 2xl:px-20 pt-10 md:pt-16 pb-20">
          <nav className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="text-foreground">News</span>
          </nav>

          <header className="w-full">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1 text-xs font-bold text-accent mb-4">
              <Newspaper className="h-3.5 w-3.5" />
              <span>{articles.length} in-depth guides</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-black tracking-tight">
              News &amp; Guides for Every Free Online Tool
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-4xl">
              Detailed tutorials, practical tips, comparisons and FAQs that show you how to get the most
              out of each tool on bg.tools, from AI background removal to PDF merging and image
              compression.
            </p>
          </header>

          {/* Search + category filters */}
          <div className="mt-8 flex flex-col gap-4 w-full">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="news-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search guides, e.g. compress, PDF, QR code..."
                className="w-full rounded-2xl border border-border bg-card py-3.5 pl-11 pr-10 text-sm font-medium focus:border-accent focus:outline-none shadow-xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 w-full">
              {(["All", ...TOOL_CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    category === c
                      ? "border-foreground bg-foreground text-background shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-sm font-semibold text-muted-foreground">
            Showing {filtered.length} of {articles.length} guides
          </p>

          <section
            aria-label="Guides"
            className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 w-full"
          >
            {filtered.map((a) => {
              const Icon = getTool(a.toolSlug)?.icon ?? BookOpen;
              return (
                <Link
                  key={a.slug}
                  to="/news/$slug"
                  params={{ slug: a.slug }}
                  className="group flex flex-col justify-between rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {a.category}
                      </span>
                    </div>
                    <h2 className="mt-4 font-display text-lg font-extrabold leading-snug group-hover:text-accent transition-colors">
                      {a.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {a.description}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {a.readingMinutes} min read
                    </span>
                    <span className="inline-flex items-center gap-1 text-accent">
                      Read guide
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </section>

          {filtered.length === 0 && (
            <div className="mt-10 rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No guides match your search. Try a different keyword or category.
            </div>
          )}
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
