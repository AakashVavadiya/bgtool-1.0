import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Faq, faqs, type FaqItem } from "@/components/Faq";
import { buildPageMeta, buildBreadcrumbsSchema } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  head: () => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f: FaqItem) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a,
        },
      })),
    };

    return buildPageMeta({
      title: "FAQ & Help Center — Answers to Background Removal & Credit Questions | bg.tools",
      description:
        "Find answers about free daily credits, background removal models, high-resolution downloads, file formats, and zero-retention privacy guarantees on bg.tools.",
      path: "/faq",
      keywords: [
        "bg.tools faq",
        "free background remover questions",
        "ai model differences",
        "bg tools credit system",
        "is bg tools safe",
      ],
      jsonLd: [
        buildBreadcrumbsSchema([
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ]),
        faqSchema,
      ],
    });
  },
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <SiteHeader />

        <main className="mx-auto max-w-6xl px-6 pt-16 md:px-12 md:pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="text-foreground">FAQ</span>
          </div>

          <Faq />
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
