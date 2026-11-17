import { useEffect, type ReactNode } from "react";
import bdaLogo from "@/assets/BDA-Logo.png";
import { FUNNEL } from "@/config/funnel";
import { loadFunnelTracking } from "@/lib/funnel-tracking";

/**
 * Standalone funnel shell: logo only (not a link), no site nav, minimal legal footer.
 * Visitors have no way out of the funnel except the CTA.
 */
export function FunnelLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    loadFunnelTracking();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl md:h-16 items-center justify-center px-4">
          <img src={bdaLogo} alt="BDA Technologies" className="h-8 w-auto md:h-9" />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/70 bg-card">
        <div className="mx-auto max-w-5xl px-4 py-8 text-center">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {FUNNEL.LEGAL_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <p className="mx-auto mt-4 max-w-2xl text-xs leading-relaxed text-muted-foreground/80">
            {FUNNEL.DISCLAIMER_TEXT}
          </p>
          <p className="mt-3 text-xs text-muted-foreground/80">
            © {new Date().getFullYear()} {FUNNEL.TEAM_ORGANISATION}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
