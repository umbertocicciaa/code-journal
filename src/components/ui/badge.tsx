import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-line bg-card-muted text-foreground/80",
        outline: "border-line bg-transparent text-muted",
        accent: "border-transparent bg-accent text-white",
        ink: "border-transparent bg-ink text-ink-foreground",
        easy: "border-transparent bg-brand-soft text-[#6b5a00]",
        medium: "border-transparent bg-accent-soft text-[#c2410c]",
        hard: "border-transparent bg-ink text-ink-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function difficultyBadgeVariant(
  difficulty: "EASY" | "MEDIUM" | "HARD",
): "easy" | "medium" | "hard" {
  switch (difficulty) {
    case "EASY":
      return "easy";
    case "MEDIUM":
      return "medium";
    case "HARD":
      return "hard";
    default: {
      const _exhaustive: never = difficulty;
      return _exhaustive;
    }
  }
}
