import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { AddProblemForm } from "@/components/journal/add-problem-form";
import { JournalFilters } from "@/components/journal/journal-filters";
import { PageHeader } from "@/components/layout/page-header";
import { Badge, difficultyBadgeVariant } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  listUserProblems,
  listUserTags,
} from "@/server/repositories/user-problems";
import { requireSession } from "@/server/session";
import { journalFiltersSchema } from "@/server/validation";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const filters = journalFiltersSchema.parse({
    query: typeof params.query === "string" ? params.query : undefined,
    difficulty:
      typeof params.difficulty === "string" ? params.difficulty : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    tagId: typeof params.tagId === "string" ? params.tagId : undefined,
  });

  const [entries, tags] = await Promise.all([
    listUserProblems(session.user.id, filters),
    listUserTags(session.user.id),
  ]);

  const solvedCount = entries.filter((entry) => entry.status === "solved").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal"
        description={`${entries.length} tracked · ${solvedCount} solved`}
      />

      <AddProblemForm />

      <Suspense fallback={null}>
        <JournalFilters tags={tags} />
      </Suspense>

      <div className="grid gap-3">
        {entries.length === 0 ? (
          <Card tone="muted">
            <CardContent className="py-12 text-center text-muted">
              No problems yet. Add your first LeetCode URL above.
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => (
            <Link key={entry.id} href={`/journal/${entry.id}`} className="group">
              <Card className="flex items-center gap-4 p-4 transition group-hover:border-ink/20 group-hover:shadow-[0_8px_24px_-16px_rgba(0,0,0,0.35)] md:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold tracking-tight md:text-lg">
                      {entry.problem.title}
                    </h3>
                    <Badge variant={difficultyBadgeVariant(entry.problem.difficulty)}>
                      {entry.problem.difficulty}
                    </Badge>
                    <Badge variant={entry.status === "solved" ? "accent" : "outline"}>
                      {entry.status === "solved" ? "Solved" : "Attempting"}
                    </Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted">{entry.problem.slug}</p>
                  {entry.problem.problemTopics.length + entry.userProblemTags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {entry.problem.problemTopics.map((topic) => (
                        <Badge key={topic.topicId}>{topic.topic.name}</Badge>
                      ))}
                      {entry.userProblemTags.map((tag) => (
                        <Badge
                          key={tag.userTagId}
                          className="border-transparent"
                          style={{
                            backgroundColor: `${tag.userTag.color}22`,
                            color: tag.userTag.color,
                          }}
                        >
                          {tag.userTag.name}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-card-muted text-muted transition group-hover:bg-ink group-hover:text-white">
                  <ChevronRight className="h-4 w-4" />
                </span>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
