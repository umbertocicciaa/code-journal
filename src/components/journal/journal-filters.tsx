"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

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
    <div className="grid gap-3 md:grid-cols-4">
      <Input
        placeholder="Search problems..."
        defaultValue={searchParams.get("query") ?? ""}
        onChange={(event) => updateParam("query", event.target.value)}
      />
      <select
        defaultValue={searchParams.get("difficulty") ?? ""}
        onChange={(event) => updateParam("difficulty", event.target.value)}
        className="h-11 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm text-white"
      >
        <option value="">All difficulties</option>
        <option value="EASY">Easy</option>
        <option value="MEDIUM">Medium</option>
        <option value="HARD">Hard</option>
      </select>
      <select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(event) => updateParam("status", event.target.value)}
        className="h-11 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm text-white"
      >
        <option value="">All statuses</option>
        <option value="attempting">Attempting</option>
        <option value="solved">Solved</option>
      </select>
      <select
        defaultValue={searchParams.get("tagId") ?? ""}
        onChange={(event) => updateParam("tagId", event.target.value)}
        className="h-11 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm text-white"
      >
        <option value="">All tags</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>
    </div>
  );
}
