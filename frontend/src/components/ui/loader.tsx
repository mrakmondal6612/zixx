import React from "react";
import { cn } from "@/lib/utils";

type LoaderVariant = "ring" | "dots" | "bar";

type LoaderProps = {
  variant?: LoaderVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const sizeMap: Record<NonNullable<LoaderProps["size"]>, string> = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function Loader({ variant = "ring", size = "md", className, label }: LoaderProps) {
  if (variant === "dots") {
    return (
      <div className={cn("flex items-center gap-1", className)} aria-label={label || "Loading"}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "inline-block h-2 w-2 rounded-full bg-primary",
              "animate-bounce",
            )}
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    );
  }

  if (variant === "bar") {
    return (
      <div className={cn("w-full max-w-xs", className)} aria-label={label || "Loading"}>
        <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
          <div className="h-full w-1/3 animate-[progress_1.2s_infinite_linear] rounded bg-primary" />
        </div>
      </div>
    );
  }

  // ring
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} aria-label={label || "Loading"}>
      <div className={cn(sizeMap[size], "animate-spin rounded-full border-2 border-muted border-t-primary")} />
    </div>
  );
}

export function FullScreenLoader({ message = "Loading...", variant = "ring" as LoaderVariant }: { message?: string; variant?: LoaderVariant }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-lg border bg-card px-6 py-6 shadow-sm">
        <Loader variant={variant} size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export default Loader;
