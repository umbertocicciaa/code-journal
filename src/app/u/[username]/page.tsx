import { notFound } from "next/navigation";
import { FeedbackProvider } from "@/components/feedback/feedback-provider";
import { AppShell } from "@/components/layout/app-shell";
import { PublicProfileGuestShell } from "@/components/profile/public-profile-guest-shell";
import { PublicProfileView } from "@/components/profile/public-profile-view";
import { shouldWrapPublicProfileWithAppShell } from "@/lib/public-profile-shell";
import { getPublicProfileByUsername } from "@/server/services/public-profile";
import { getSession } from "@/server/session";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const session = await getSession();
  const content = (
    <PublicProfileView user={profile.user} stats={profile.stats} />
  );

  const viewer = session?.user;
  if (shouldWrapPublicProfileWithAppShell(Boolean(viewer))) {
    const viewerWithUsername = viewer as typeof viewer & { username?: string };
    const viewerUsername = viewerWithUsername.username ?? viewerWithUsername.name;

    return (
      <FeedbackProvider>
        <AppShell username={viewerUsername}>{content}</AppShell>
      </FeedbackProvider>
    );
  }

  return (
    <PublicProfileGuestShell username={profile.user.username}>
      {content}
    </PublicProfileGuestShell>
  );
}
