import { Quote, Star } from "lucide-react";
import { FUNNEL } from "@/config/funnel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FunnelTestimonials({ title = "What founders say after the call" }) {
  if (!FUNNEL.TESTIMONIALS.length) return null;
  return (
    <section className="py-14 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-3xl tracking-tight text-foreground md:text-4xl">{title}</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {FUNNEL.TESTIMONIALS.map((t, i) => (
            <figure
              key={i}
              className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5 text-primary" aria-label="5 out of 5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <Quote className="h-5 w-5 text-primary/30" />
              </div>
              {t.result && <p className="mt-4 text-sm font-semibold text-primary">{t.result}</p>}
              <blockquote className="mt-2 flex-1 text-[15px] leading-relaxed text-foreground/85">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-sm font-semibold text-primary">
                  {t.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{t.name}</span>
                  <span className="block text-xs text-muted-foreground">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedIn() {
  if (!FUNNEL.FEATURED_IN.length) return null;
  return (
    <section className="border-y border-border/70 bg-card py-8">
      <div className="mx-auto max-w-5xl px-4">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          As featured in
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {FUNNEL.FEATURED_IN.map((p) =>
            p.logo ? (
              <img
                key={p.name}
                src={p.logo}
                alt={p.name}
                className="h-7 w-auto opacity-70 grayscale md:h-8"
              />
            ) : (
              <span
                key={p.name}
                className="text-lg font-semibold tracking-tight text-muted-foreground/70"
              >
                {p.name}
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

export function FunnelFaq() {
  if (!FUNNEL.FAQ.length) return null;
  return (
    <section className="py-14 md:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center text-3xl tracking-tight text-foreground md:text-4xl">
          Questions before the call
        </h2>
        <Accordion
          type="single"
          collapsible
          defaultValue="faq-0"
          className="mt-8 rounded-3xl border border-border bg-card px-6"
        >
          {FUNNEL.FAQ.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`} className="last:border-b-0">
              <AccordionTrigger className="py-5 text-base font-medium hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
