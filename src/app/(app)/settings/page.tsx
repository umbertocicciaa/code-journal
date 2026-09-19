import { PageHeader } from "@/components/layout/page-header";
import { JournalTransfer } from "@/components/settings/journal-transfer";
import { SettingsForm } from "@/components/settings/settings-form";
import { getLeetcodeCredentials } from "@/server/repositories/leetcode-credentials";
import { listUserTags } from "@/server/repositories/user-problems";
import { findUserById } from "@/server/repositories/users";
import { requireSession } from "@/server/session";

export default async function SettingsPage() {
  const session = await requireSession();
  const [user, tags, credential] = await Promise.all([
    findUserById(session.user.id),
    listUserTags(session.user.id),
    getLeetcodeCredentials(session.user.id),
  ]);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Profile, tags, LeetCode integration, and backups"
      />
      <SettingsForm
        name={user.name}
        statsPublic={user.statsPublic}
        tags={tags}
        hasLeetcodeCredential={Boolean(credential)}
        lastVerifiedAt={credential?.lastVerifiedAt ?? null}
      />
      <JournalTransfer />
    </div>
  );
}
