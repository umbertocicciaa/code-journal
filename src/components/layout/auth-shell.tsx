import { BrandMark } from "@/components/layout/brand-mark";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background p-2 md:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1400px] flex-col items-center justify-center rounded-[32px] bg-surface px-6 py-16 md:min-h-[calc(100vh-2rem)]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark size="lg" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Code Journal
            </h1>
            <p className="text-sm text-muted">
              Track, review, and master your LeetCode practice
            </p>
          </div>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
