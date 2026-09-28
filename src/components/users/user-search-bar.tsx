"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export function UserSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateQuery(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    const query = params.toString();
    router.push(query ? `/users?${query}` : "/users");
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <Input
        placeholder="Search by username or name..."
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(event) => updateQuery(event.target.value)}
        className="pl-10"
        aria-label="Search users"
      />
    </div>
  );
}
