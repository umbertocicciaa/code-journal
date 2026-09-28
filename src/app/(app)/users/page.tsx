import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { UserSearchBar } from "@/components/users/user-search-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { searchUsers } from "@/server/repositories/users";
import { requireSession } from "@/server/session";
import { userSearchSchema } from "@/server/validation";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSession();
  const params = await searchParams;
  const rawQuery = typeof params.q === "string" ? params.q : "";
  const parsed = userSearchSchema.safeParse({ q: rawQuery });
  const users = parsed.success ? await searchUsers(parsed.data.q) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        description="Find other practitioners and view their public stats."
      />

      <Suspense fallback={null}>
        <UserSearchBar />
      </Suspense>

      {!parsed.success || !rawQuery.trim() ? (
        <Card tone="muted">
          <CardContent className="py-12 text-center text-muted">
            Type a username or display name to search.
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card tone="muted">
          <CardContent className="py-12 text-center text-muted">
            No users matched &ldquo;{parsed.data.q}&rdquo;.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {users.map((person) => {
            const initial = person.username.charAt(0).toUpperCase();
            return (
              <Link
                key={person.id}
                href={`/u/${person.username}`}
                className="group"
              >
                <Card className="flex items-center gap-4 p-4 transition group-hover:border-ink/20 group-hover:shadow-[0_8px_24px_-16px_rgba(0,0,0,0.35)] md:p-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-semibold text-ink">
                    {initial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold tracking-tight md:text-lg">
                        {person.name}
                      </h3>
                      <Badge variant={person.statsPublic ? "accent" : "outline"}>
                        {person.statsPublic ? "Public stats" : "Private stats"}
                      </Badge>
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted">@{person.username}</p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-card-muted text-muted transition group-hover:bg-ink group-hover:text-white">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
