import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Columns3,
  Repeat,
  Settings,
  Users,
} from "lucide-react";

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const APP_SHELL_NAV_ITEMS: AppNavItem[] = [
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/review", label: "Review", icon: Repeat },
  { href: "/kanban", label: "Kanban", icon: Columns3 },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/users", label: "People", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];
