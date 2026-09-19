import { ReviewSession } from "@/components/review/review-session";
import { listDueReviews } from "@/server/repositories/user-problems";
import { requireSession } from "@/server/session";

export default async function ReviewPage() {
  const session = await requireSession();
  const entries = await listDueReviews(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Review</h1>
        <p className="text-white/60">Leitner spaced repetition queue</p>
      </div>
      <ReviewSession entries={entries} />
    </div>
  );
}
