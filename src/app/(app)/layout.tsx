import { AppShell } from "@/components/layout/app-shell";
import { FeedbackProvider } from "@/components/feedback/feedback-provider";
import { requireSession } from "@/server/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const user = session.user as typeof session.user & { username?: string };
  const username = user.username ?? user.name;

  return (
    <FeedbackProvider>
      <AppShell username={username}>{children}</AppShell>
    </FeedbackProvider>
  );
}
