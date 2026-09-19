import { PageHeader } from "@/components/layout/page-header";
import { ReviewSession } from "@/components/review/review-session";
import { listDueReviews } from "@/server/repositories/user-problems";
import { requireSession } from "@/server/session";

export default async function ReviewPage() {
  const session = await requireSession();
  const entries = await listDueReviews(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review"
        description={
          entries.length === 0
            ? "Leitner spaced repetition queue"
            : `${entries.length} problem${entries.length === 1 ? "" : "s"} due for review`
        }
      />
      <ReviewSession entries={entries} />
    </div>
  );
}
