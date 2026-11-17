import { Quote, Star } from "lucide-react";
import { FUNNEL } from "@/config/funnel";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FunnelTestimonials({ title = "What founders say after the call" }) {
  if (!FUNNEL.TESTIMONIALS.length) return null;
  return (
    <section className="py-10 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-2xl tracking-tight text-balance text-foreground sm:text-3xl md:text-4xl">
          {title}
        </h2>
        <div className="mt-6 grid gap-4 md:mt-10 md:grid-cols-3">
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

/**
 * Client logos on white cards, scrolling right-to-left in an endless loop.
 * The list is rendered twice and the strip moves by -50%, so the loop has no visible jump.
 * Spacing is padding on each item (not `gap`) so both halves are exactly the same width.
 * Pauses on hover; with "reduce motion" on, it becomes a static row you can swipe.
 */
export function TrustedBy() {
  const logos = FUNNEL.TRUSTED_BY;
  if (!logos.length) return null;
  return (
    <section className="border-b border-border/70 bg-background pb-8 pt-1 md:pb-10 md:pt-2">
      <div className="mx-auto max-w-5xl md:px-4">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Trusted by
        </p>
        <div className="group mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] motion-reduce:overflow-x-auto md:mt-6">
          <ul className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
            {[...logos, ...logos].map((c, i) => {
              const copy = i >= logos.length;
              return (
                <li
                  key={i}
                  aria-hidden={copy || undefined}
                  className={cn("shrink-0 pr-3 md:pr-4", copy && "motion-reduce:hidden")}
                >
                  <div className="flex h-20 w-40 items-center justify-center rounded-2xl border border-border bg-background px-4 md:h-24 md:w-48">
                    <img
                      src={c.logo}
                      alt={copy ? "" : c.name}
                      width={200}
                      height={80}
                      decoding="async"
                      className="max-h-11 w-auto max-w-full object-contain md:max-h-14"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function FunnelFaq() {
  if (!FUNNEL.FAQ.length) return null;
  return (
    <section className="py-10 md:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center text-2xl tracking-tight text-balance text-foreground sm:text-3xl md:text-4xl">
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
