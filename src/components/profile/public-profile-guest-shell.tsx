import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";

export function PublicProfileGuestShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const initial = username.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background p-2 md:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1400px] flex-col rounded-[32px] bg-surface p-3 md:min-h-[calc(100vh-2rem)] md:p-5">
        <header className="flex items-center justify-between gap-3 rounded-[24px] bg-ink px-3 py-2.5 text-ink-foreground md:px-4">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark />
            <span className="text-base font-semibold tracking-tight">Code Journal</span>
          </Link>
          <div className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-ink">
              {initial}
            </span>
            <span className="text-sm text-white/85">@{username}</span>
          </div>
        </header>

        <main className="flex-1 px-1 pb-8 pt-6 md:px-2">{children}</main>
      </div>
    </div>
  );
}
