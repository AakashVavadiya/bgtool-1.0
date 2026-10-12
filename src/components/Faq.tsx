import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FaqItem {
  q: string;
  a: string;
  note?: string;
}

export const pricingFaqs: FaqItem[] = [
  {
    q: "What are Bronze, Silver, and Gold Tokens?",
    a: "Bronze Tokens are free daily credits (login required) that refresh every day. Silver Tokens are monthly subscription allowances for Lite (40/mo) & Pro (200/mo). Gold Tokens are one-time pay-as-you-go packs that never expire.",
  },
  {
    q: "Do tokens expire?",
    a: "Bronze Tokens expire every day. Silver Tokens expire at the end of each month. Gold Tokens never expire.",
  },
  {
    q: "Do I need an account to get the 10 free daily credits?",
    a: "Yes. Simply log in or sign up to your account to claim your 10 free Bronze Tokens every day.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, and you keep access until the end of the billing period.",
  },
  {
    q: "Do unused monthly tokens roll over?",
    a: "No. Monthly Silver Tokens reset at the beginning of each billing cycle to maintain your active quota.",
  },
  {
    q: "Is there a refund?",
    a: "Contact support within 7 days if no tokens were used. [Note: Policy subject to confirmation]",
    note: "Flagged for confirmation",
  },
  {
    q: "Can I use images commercially?",
    a: "Yes, on all plans. You retain 100% intellectual property ownership of all uploaded and processed assets.",
  },
];

export const faqs: FaqItem[] = pricingFaqs;

export function Faq({ items = pricingFaqs }: { items?: FaqItem[] }) {
  return (
    <section id="faq" className="border-t border-border px-5 py-20 md:px-10 md:py-28">
      <div className="grid gap-12 md:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">
            faq
          </p>
          <h2 className="mt-6 font-display text-3xl font-medium leading-[1.05] md:text-5xl">
            Questions, answered<span className="text-accent">.</span>
          </h2>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm">
            Everything you need to know about our transparent token billing, credit lifecycles, and plan features.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {items.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`} className="border-border">
              <AccordionTrigger className="text-left font-display text-base font-medium md:text-lg hover:no-underline hover:text-amber-500 transition-colors">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="max-w-2xl text-sm leading-relaxed text-muted-foreground space-y-2">
                <p>{f.a}</p>
                {f.note && (
                  <span className="inline-block text-[11px] font-mono text-amber-500/90 bg-amber-500/10 px-2 py-0.5 rounded">
                    {f.note}
                  </span>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
