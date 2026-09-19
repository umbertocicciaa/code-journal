"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Columns3,
  Repeat,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/server/auth-client";
import { Button } from "@/components/ui/button";
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

  async function logout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.35),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.25),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(236,72,153,0.18),transparent_35%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 md:px-8">
        <header className="mb-8 flex items-center justify-between rounded-3xl border border-white/15 bg-white/10 px-6 py-4 shadow-2xl backdrop-blur-2xl">
          <div>
            <Link href="/journal" className="text-xl font-semibold text-white">
              Code Journal
            </Link>
            {username ? (
              <p className="text-sm text-white/60">@{username}</p>
            ) : null}
          </div>
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={logout}>
              Log out
            </Button>
          </nav>
        </header>
        <main className="flex-1 pb-8">{children}</main>
        <nav className="sticky bottom-4 grid grid-cols-5 gap-2 rounded-3xl border border-white/15 bg-black/30 p-2 backdrop-blur-2xl md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] text-white/70 hover:bg-white/10 hover:text-white"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
