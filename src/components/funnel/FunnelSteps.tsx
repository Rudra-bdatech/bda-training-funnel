import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepState = "done" | "active" | "locked";

/**
 * Compact progress row: [icon] Label — [icon] Label — [icon] Label, centered as a group.
 * Connectors have a fixed length so the row stays centered whatever the label widths are.
 */
export function FunnelSteps({ steps }: { steps: { label: string; state: StepState }[] }) {
  return (
    <ol className="mx-auto flex w-fit max-w-full items-center" aria-label="Your progress">
      {steps.map((step, i) => (
        <li key={step.label} className="flex items-center">
          <div
            className="flex items-center gap-1 sm:gap-1.5 md:gap-2"
            aria-current={step.state === "active" ? "step" : undefined}
          >
            <span
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-semibold transition-colors sm:h-6 sm:w-6 sm:text-[11px] md:h-7 md:w-7 md:text-xs",
                step.state === "done" && "border-primary bg-primary text-primary-foreground",
                step.state === "active" &&
                  "border-primary bg-accent text-primary ring-2 ring-primary/15 md:ring-4",
                step.state === "locked" && "border-border bg-card text-muted-foreground",
              )}
            >
              {step.state === "done" ? (
                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
              ) : step.state === "locked" ? (
                <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              ) : (
                i + 1
              )}
            </span>
            <span
              className={cn(
                "whitespace-nowrap text-[11px] font-medium sm:text-xs md:text-sm",
                step.state === "locked" ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <span
              aria-hidden="true"
              className="mx-1.5 h-0.5 w-3 shrink-0 overflow-hidden rounded-full bg-border min-[360px]:mx-2 min-[360px]:w-5 sm:w-8 md:mx-3 md:w-12"
            >
              <span
                className={cn(
                  "block h-full bg-primary transition-all duration-700",
                  step.state === "done" ? "w-full" : "w-0",
                )}
              />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
