import { useEffect, type ReactNode } from "react";
import { FUNNEL } from "@/config/funnel";
import { loadFunnelTracking } from "@/lib/funnel-tracking";

export function FunnelLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    loadFunnelTracking();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
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
