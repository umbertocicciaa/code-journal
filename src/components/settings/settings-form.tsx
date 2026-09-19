"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  createUserTagAction,
  deleteLeetcodeCredentialAction,
  deleteUserTagAction,
  saveLeetcodeCredentialAction,
  updateSettingsAction,
} from "@/server/actions/settings-actions";
import { useFeedback } from "@/components/feedback/feedback-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SettingsFormProps {
  name: string;
  statsPublic: boolean;
  tags: Array<{ id: string; name: string; color: string }>;
  hasLeetcodeCredential: boolean;
  lastVerifiedAt: Date | null;
}

export function SettingsForm({
  name,
  statsPublic,
  tags,
  hasLeetcodeCredential,
  lastVerifiedAt,
}: SettingsFormProps) {
  const router = useRouter();
  const feedback = useFeedback();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" defaultValue={name} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Public stats</p>
              <p className="text-sm text-muted">
                Allow others to view your stats at /u/username
              </p>
            </div>
            <Switch
              checked={statsPublic}
              onCheckedChange={(checked) =>
                startTransition(async () => {
                  const result = await updateSettingsAction({ statsPublic: checked });
                  if (!result.success) {
                    feedback.showError("Unable to update settings", result.error);
                    return;
                  }
                  router.refresh();
                })
              }
            />
          </div>
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const input = document.getElementById("name") as HTMLInputElement;
                const result = await updateSettingsAction({ name: input.value });
                if (!result.success) {
                  feedback.showError("Unable to save profile", result.error);
                  return;
                }
                feedback.showSuccess("Profile saved", "Your display name was updated.");
                router.refresh();
              })
            }
          >
            Save profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>LeetCode Premium cookies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted">
            Optional. Used server-side to fetch company tags for new problems.
            Stored encrypted with AES-256-GCM.
          </p>
          {hasLeetcodeCredential ? (
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm text-[#6b5a00]">
              <span className="h-2 w-2 rounded-full bg-positive" />
              Credential saved
              {lastVerifiedAt
                ? ` · verified ${lastVerifiedAt.toLocaleString()}`
                : ""}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="session">LEETCODE_SESSION</Label>
            <Input id="session" name="session" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="csrf">csrftoken</Label>
            <Input id="csrf" name="csrf" />
          </div>
          <div className="flex gap-2">
            <Button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const sessionInput = document.getElementById(
                    "session",
                  ) as HTMLInputElement;
                  const csrfInput = document.getElementById(
                    "csrf",
                  ) as HTMLInputElement;
                  const result = await saveLeetcodeCredentialAction({
                    session: sessionInput.value,
                    csrf: csrfInput.value,
                  });
                  if (!result.success) {
                    feedback.showError("Credential not saved", result.error);
                    return;
                  }
                  feedback.showSuccess(
                    "Credentials saved",
                    "LeetCode session verified and stored securely.",
                  );
                  router.refresh();
                })
              }
            >
              Save credentials
            </Button>
            {hasLeetcodeCredential ? (
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await deleteLeetcodeCredentialAction();
                    if (!result.success) {
                      feedback.showError("Unable to remove credentials", result.error);
                      return;
                    }
                    router.refresh();
                  })
                }
              >
                Remove
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium"
                style={{
                  backgroundColor: `${tag.color}22`,
                  borderColor: `${tag.color}55`,
                  color: tag.color,
                }}
              >
                {tag.name}
                <button
                  type="button"
                  aria-label={`Remove tag ${tag.name}`}
                  className="opacity-60 transition hover:opacity-100"
                  onClick={() =>
                    startTransition(async () => {
                      const result = await deleteUserTagAction(tag.id);
                      if (!result.success) {
                        feedback.showError("Unable to delete tag", result.error);
                        return;
                      }
                      router.refresh();
                    })
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
            <Input id="tag-name" placeholder="Tag name" />
            <div className="relative">
              <input
                type="color"
                aria-label="Tag color"
                defaultValue="#ff6b3b"
                className="absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
                onChange={(event) => {
                  const colorInput = document.getElementById("tag-color") as HTMLInputElement;
                  colorInput.value = event.target.value;
                }}
              />
              <Input
                id="tag-color"
                defaultValue="#ff6b3b"
                placeholder="#ff6b3b"
                className="pl-11 font-mono text-xs"
              />
            </div>
            <Button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const nameInput = document.getElementById(
                    "tag-name",
                  ) as HTMLInputElement;
                  const colorInput = document.getElementById(
                    "tag-color",
                  ) as HTMLInputElement;
                  const result = await createUserTagAction({
                    name: nameInput.value,
                    color: colorInput.value,
                  });
                  if (!result.success) {
                    feedback.showError("Unable to create tag", result.error);
                    return;
                  }
                  nameInput.value = "";
                  router.refresh();
                })
              }
            >
              Add tag
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
