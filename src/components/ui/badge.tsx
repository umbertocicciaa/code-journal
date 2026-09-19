import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-white/20 bg-white/10 text-white/90",
        easy: "border-emerald-400/30 bg-emerald-500/20 text-emerald-100",
        medium: "border-amber-400/30 bg-amber-500/20 text-amber-100",
        hard: "border-rose-400/30 bg-rose-500/20 text-rose-100",
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
