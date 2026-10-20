import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getNewsArticle, getRelatedArticles } from "@/lib/news";
import { buildPageMeta, SITE_URL } from "@/lib/seo";
import { ArrowRight, Clock, CalendarDays, Sparkles, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/news/$slug")({
  loader: ({ params }) => {
    const article = getNewsArticle(params.slug);
    if (!article) throw notFound();
    return { slug: article.slug };
  },
  head: ({ loaderData }) => {
    const article = loaderData ? getNewsArticle(loaderData.slug) : undefined;
    if (!article) return {};

    const url = `${SITE_URL}/news/${article.slug}`;
    const seo = buildPageMeta({
      title: article.metaTitle,
      description: article.description,
      path: `/news/${article.slug}`,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.description,
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
          mainEntityOfPage: url,
          keywords: article.keywords.join(", "),
          author: { "@type": "Organization", name: "bg.tools", url: SITE_URL },
          publisher: {
            "@type": "Organization",
            name: "bg.tools",
            url: SITE_URL,
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "News", item: `${SITE_URL}/news` },
            { "@type": "ListItem", position: 3, name: article.toolName, item: url },
          ],
        },
      ],
    });
    // Article pages should advertise themselves as articles to social networks.
    const meta = seo.meta.map((m) =>
      m["property"] === "og:type" ? { property: "og:type", content: "article" } : m,
    );
    return { meta, links: seo.links, scripts: seo.scripts };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-3xl font-black">Guide not found</h1>
        <Link to="/news" className="text-accent font-bold hover:underline">
          Browse all guides
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
  component: NewsArticlePage,
});

function NewsArticlePage() {
  const { slug } = Route.useLoaderData();
  const article = getNewsArticle(slug)!;
  const related = getRelatedArticles(article, 4);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <SiteHeader />

        <main className="w-full px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 2xl:px-20 pt-10 md:pt-16 pb-20">
          <nav
            aria-label="Breadcrumb"
            className="inline-flex flex-wrap items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6"
          >
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link to="/news" className="hover:underline">News</Link>
            <span>/</span>
            <span className="text-foreground">{article.toolName}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] w-full">
            <article className="min-w-0 max-w-4xl xl:max-w-5xl">
              <header>
                <span className="inline-block rounded-full bg-accent/10 border border-accent/25 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">
                  {article.category}
                </span>
                <h1 className="mt-4 font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                  {article.title}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <time dateTime={article.publishedAt}>{article.publishedAt}</time>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {article.readingMinutes} min read
                  </span>
                  <span>By the bg.tools team</span>
                </div>
              </header>

              <Link
                to="/tools/$slug"
                params={{ slug: article.toolSlug }}
                className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-accent/10 p-4 transition-colors hover:bg-accent/15"
              >
                <span className="flex items-center gap-3 text-sm font-bold">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Try {article.toolName} free right now
                </span>
                <ArrowRight className="h-4 w-4 text-accent" />
              </Link>

              {article.sections.map((s) => (
                <section key={s.id} id={s.id} className="mt-10 scroll-mt-24">
                  <h2 className="font-display text-2xl font-extrabold tracking-tight">
                    {s.heading}
                  </h2>
                  {s.paragraphs?.map((p, i) => (
                    <p key={i} className="mt-4 text-base leading-relaxed text-foreground/85">
                      {p}
                    </p>
                  ))}
                  {s.list &&
                    (s.ordered ? (
                      <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-relaxed text-foreground/85 marker:font-bold marker:text-accent">
                        {s.list.map((li, i) => (
                          <li key={i}>{li}</li>
                        ))}
                      </ol>
                    ) : (
                      <ul className="mt-4 space-y-2.5">
                        {s.list.map((li, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2.5 text-base leading-relaxed text-foreground/85"
                          >
                            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent" />
                            <span>{li}</span>
                          </li>
                        ))}
                      </ul>
                    ))}
                </section>
              ))}

              <section id="faq" className="mt-12 scroll-mt-24">
                <h2 className="font-display text-2xl font-extrabold tracking-tight">
                  Frequently Asked Questions About {article.toolName}
                </h2>
                <div className="mt-5 space-y-3">
                  {article.faqs.map((f) => (
                    <details
                      key={f.q}
                      className="group rounded-2xl border border-border bg-card p-5 open:border-accent/40"
                    >
                      <summary className="cursor-pointer list-none font-bold flex items-center justify-between gap-4">
                        <span>{f.q}</span>
                        <span className="text-accent transition-transform group-open:rotate-45 text-xl leading-none">
                          +
                        </span>
                      </summary>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>

              <Link
                to="/tools/$slug"
                params={{ slug: article.toolSlug }}
                className="mt-12 inline-flex items-center gap-2 rounded-2xl bg-foreground px-6 py-3.5 text-sm font-extrabold text-background shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Open {article.toolName}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border border-border bg-card p-5">
                <h2 className="font-display text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
                  In this guide
                </h2>
                <ul className="mt-3 space-y-2 text-sm font-semibold">
                  {article.sections
                    .filter((s) => !s.id.startsWith("benefit-"))
                    .map((s) => (
                      <li key={s.id}>
                        <a href={`#${s.id}`} className="text-muted-foreground hover:text-accent transition-colors">
                          {s.heading}
                        </a>
                      </li>
                    ))}
                  <li>
                    <a href="#faq" className="text-muted-foreground hover:text-accent transition-colors">
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>

              {related.length > 0 && (
                <div className="rounded-3xl border border-border bg-card p-5">
                  <h2 className="font-display text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
                    Related guides
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {related.map((r) => (
                      <li key={r.slug}>
                        <Link
                          to="/news/$slug"
                          params={{ slug: r.slug }}
                          className="block text-sm font-bold leading-snug hover:text-accent transition-colors"
                        >
                          {r.toolName}
                          <span className="block text-xs font-medium text-muted-foreground">
                            {r.readingMinutes} min read
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link to="/news" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline">
                    All guides <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </aside>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
