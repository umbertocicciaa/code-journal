"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Columns3,
  LogOut,
  Repeat,
  Settings,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/server/auth-client";
import { BrandMark } from "@/components/layout/brand-mark";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/review", label: "Review", icon: Repeat },
  { href: "/kanban", label: "Kanban", icon: Columns3 },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  username,
}: {
  children: React.ReactNode;
  username?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const initial = username?.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-background p-2 md:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1400px] flex-col rounded-[32px] bg-surface p-3 md:min-h-[calc(100vh-2rem)] md:p-5">
        <header className="flex items-center justify-between gap-3 rounded-[24px] bg-ink px-3 py-2.5 text-ink-foreground shadow-[0_12px_30px_-18px_rgba(0,0,0,0.6)] md:px-4">
          <div className="flex items-center gap-3">
            <Link href="/journal" aria-label="Code Journal home">
              <BrandMark />
            </Link>
            <span className="hidden whitespace-nowrap text-base font-semibold tracking-tight lg:inline">
              Code Journal
            </span>
          </div>

          <nav className="hidden items-center gap-0.5 md:flex">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition lg:px-4",
                    active
                      ? "bg-white text-ink"
                      : "text-white/70 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {username ? (
              <div
                className="flex items-center gap-2 rounded-full bg-white/10 p-1 lg:pr-3"
                title={`@${username}`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-ink">
                  {initial}
                </span>
                <span className="hidden max-w-[140px] truncate text-sm text-white/85 lg:inline">
                  @{username}
                </span>
              </div>
            ) : null}
            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-1 pb-24 pt-6 md:px-2 md:pb-8">{children}</main>

        <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 gap-1 rounded-[24px] bg-ink p-1.5 text-white shadow-[0_16px_40px_-16px_rgba(0,0,0,0.6)] md:hidden">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] transition",
                  active ? "bg-white text-ink" : "text-white/70 hover:bg-white/10",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
