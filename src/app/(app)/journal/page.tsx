import Link from "next/link";
import { Suspense } from "react";
import { AddProblemForm } from "@/components/journal/add-problem-form";
import { JournalFilters } from "@/components/journal/journal-filters";
import { Badge, difficultyBadgeVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Journal</h1>
        <p className="text-white/60">Your tracked LeetCode problems</p>
      </div>

      <AddProblemForm />

      <Suspense fallback={null}>
        <JournalFilters tags={tags} />
      </Suspense>

      <div className="grid gap-4">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-white/60">
              No problems yet. Add your first LeetCode URL above.
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => (
            <Link key={entry.id} href={`/journal/${entry.id}`}>
              <Card className="transition hover:bg-white/15">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>{entry.problem.title}</CardTitle>
                    <p className="text-sm text-white/50">{entry.problem.slug}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={difficultyBadgeVariant(entry.problem.difficulty)}>
                      {entry.problem.difficulty}
                    </Badge>
                    <Badge>{entry.status}</Badge>
                    {entry.problem.problemTopics.map((topic) => (
                      <Badge key={topic.topicId}>{topic.topic.name}</Badge>
                    ))}
                    {entry.userProblemTags.map((tag) => (
                      <Badge key={tag.userTagId}>{tag.userTag.name}</Badge>
                    ))}
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
