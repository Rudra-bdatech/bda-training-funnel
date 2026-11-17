import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepState = "done" | "active" | "locked";

export function FunnelSteps({ steps }: { steps: { label: string; state: StepState }[] }) {
  return (
    <ol className="mx-auto flex w-full max-w-xl items-center" aria-label="Your progress">
      {steps.map((step, i) => (
        <li key={step.label} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
          <div className="flex flex-col items-center gap-2">
            <span
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full border text-sm font-semibold transition-colors",
                step.state === "done" && "border-primary bg-primary text-primary-foreground",
                step.state === "active" &&
                  "border-primary bg-accent text-primary ring-4 ring-primary/15",
                step.state === "locked" && "border-border bg-card text-muted-foreground",
              )}
              aria-current={step.state === "active" ? "step" : undefined}
            >
              {step.state === "done" ? (
                <Check className="h-4 w-4" strokeWidth={2.5} />
              ) : step.state === "locked" ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                i + 1
              )}
            </span>
            <span
              className={cn(
                "whitespace-nowrap text-xs font-medium md:text-sm",
                step.state === "locked" ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="mx-2 mb-6 h-0.5 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className={cn(
                  "h-full bg-primary transition-all duration-700",
                  step.state === "done" ? "w-full" : "w-0",
                )}
              />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
