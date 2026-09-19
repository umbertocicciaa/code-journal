"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function JournalFilters({
  tags,
}: {
  tags: Array<{ id: string; name: string; color: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/journal?${params.toString()}`);
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search problems..."
          defaultValue={searchParams.get("query") ?? ""}
          onChange={(event) => updateParam("query", event.target.value)}
          className="pl-10"
        />
      </div>
      <Select
        defaultValue={searchParams.get("difficulty") ?? ""}
        onChange={(event) => updateParam("difficulty", event.target.value)}
      >
        <option value="">All difficulties</option>
        <option value="EASY">Easy</option>
        <option value="MEDIUM">Medium</option>
        <option value="HARD">Hard</option>
      </Select>
      <Select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(event) => updateParam("status", event.target.value)}
      >
        <option value="">All statuses</option>
        <option value="attempting">Attempting</option>
        <option value="solved">Solved</option>
      </Select>
      <Select
        defaultValue={searchParams.get("tagId") ?? ""}
        onChange={(event) => updateParam("tagId", event.target.value)}
      >
        <option value="">All tags</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
