"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addManualProblemAction,
  addProblemByUrlAction,
  type ActionResult,
} from "@/server/actions/journal-actions";
import { useFeedback } from "@/components/feedback/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: ActionResult<{ userProblemId: string }> = {
  success: false,
  error: "",
} as ActionResult<{ userProblemId: string }>;

export function AddProblemForm() {
  const router = useRouter();
  const feedback = useFeedback();
  const [urlState, urlAction, urlPending] = useActionState(
    addProblemByUrlAction,
    initialState,
  );
  const [manualForced, setManualForced] = useState(false);
  const manualOpen =
    manualForced || (!urlState.success && Boolean(urlState.needsManual));
  const draft =
    !urlState.success && urlState.draft ? urlState.draft : null;
  const [manualState, manualAction, manualPending] = useActionState(
    addManualProblemAction,
    initialState,
  );

  useEffect(() => {
    if (urlState.success && urlState.data?.userProblemId) {
      router.push(`/journal/${urlState.data.userProblemId}`);
      return;
    }

    if (!urlState.success && urlState.error && !urlState.needsManual) {
      feedback.showError("Could not add problem", urlState.error);
    }

    if (!urlState.success && urlState.needsManual && urlState.error) {
      feedback.showInfo(
        "Manual entry required",
        `${urlState.error} Fill in the missing details below.`,
      );
    }
  }, [urlState, router, feedback]);

  useEffect(() => {
    if (manualState.success && manualState.data?.userProblemId) {
      router.push(`/journal/${manualState.data.userProblemId}`);
      return;
    }

    if (!manualState.success && manualState.error) {
      feedback.showError("Could not save problem", manualState.error);
    }
  }, [manualState, router, feedback]);

  return (
    <div className="space-y-4">
      <Card tone="ink">
        <CardHeader>
          <CardTitle>Add from LeetCode URL</CardTitle>
          <CardDescription className="text-white/60">
            Paste a problem link; title, difficulty, topics and description are fetched for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={urlAction} className="flex flex-col gap-3 md:flex-row">
            <Input
              name="url"
              placeholder="https://leetcode.com/problems/two-sum/"
              required
              className="border-white/10 bg-white/10 text-white placeholder:text-white/40 focus-visible:border-white/30 focus-visible:ring-white/10"
            />
            <Button type="submit" variant="accent" disabled={urlPending} className="md:px-7">
              {urlPending ? "Fetching..." : "Add problem"}
            </Button>
          </form>
          <button
            type="button"
            className="mt-3 text-sm text-white/60 underline-offset-4 transition hover:text-white hover:underline"
            onClick={() => setManualForced(true)}
          >
            Enter problem manually
          </button>
        </CardContent>
      </Card>

      {manualOpen ? (
        <Card>
          <CardHeader>
            <CardTitle>Manual entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={manualAction} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={String(draft?.title ?? "")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    defaultValue={String(draft?.slug ?? "")}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    name="url"
                    defaultValue={String(draft?.url ?? "")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    id="difficulty"
                    name="difficulty"
                    defaultValue={String(draft?.difficulty ?? "MEDIUM")}
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topicsText">Topics</Label>
                <Input
                  id="topicsText"
                  name="topicsText"
                  placeholder="Array, Hash Table, Dynamic Programming"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionMd">Description (Markdown)</Label>
                <Textarea
                  id="descriptionMd"
                  name="descriptionMd"
                  className="min-h-[180px]"
                />
              </div>
              <input type="hidden" name="topics" value="[]" />
              <input type="hidden" name="companies" value="[]" />
              <Button type="submit" disabled={manualPending}>
                {manualPending ? "Saving..." : "Save manual problem"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
