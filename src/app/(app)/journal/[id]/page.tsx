import { notFound } from "next/navigation";
import { ProblemDetail } from "@/components/journal/problem-detail";
import {
  findUserProblemById,
  listUserTags,
} from "@/server/repositories/user-problems";
import { requireSession } from "@/server/session";

export default async function JournalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const [entry, tags] = await Promise.all([
    findUserProblemById(session.user.id, id),
    listUserTags(session.user.id),
  ]);

  if (!entry) {
    notFound();
  }

  return <ProblemDetail entry={entry} tags={tags} />;
}
