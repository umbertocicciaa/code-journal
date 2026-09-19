import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-2xl bg-brand text-ink",
        size === "md" ? "h-10 w-10" : "h-14 w-14 rounded-[20px]",
        className,
      )}
    >
      <Zap
        className={size === "md" ? "h-5 w-5" : "h-7 w-7"}
        strokeWidth={2.5}
        fill="currentColor"
      />
    </span>
  );
}
