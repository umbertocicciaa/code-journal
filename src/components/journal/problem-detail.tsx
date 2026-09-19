"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { MarkdownViewer } from "@/components/markdown/markdown-viewer";
import { useFeedback } from "@/components/feedback/feedback-provider";
import { Badge, difficultyBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createSolutionAction,
  deleteSolutionAction,
  deleteUserProblemAction,
  refreshProblemFromLeetcodeAction,
  updateUserProblemAction,
} from "@/server/actions/journal-actions";

interface ProblemDetailProps {
  entry: NonNullable<Awaited<ReturnType<typeof import("@/server/repositories/user-problems").findUserProblemById>>>;
  tags: Array<{ id: string; name: string; color: string }>;
}

export function ProblemDetail({ entry, tags }: ProblemDetailProps) {
  const router = useRouter();
  const feedback = useFeedback();
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState(
    entry.userProblemTags.map((tag) => tag.userTagId),
  );

  function saveNotes(formData: FormData) {
    startTransition(async () => {
      const result = await updateUserProblemAction(entry.id, {
        notesMd: String(formData.get("notesMd") ?? ""),
        tagIds: selectedTags,
      });
      if (!result.success) {
        feedback.showError("Unable to save notes", result.error);
        return;
      }
      feedback.showSuccess("Notes saved", "Your notes were updated.");
      router.refresh();
    });
  }

  function toggleStatus() {
    startTransition(async () => {
      const result = await updateUserProblemAction(entry.id, {
        status: entry.status === "solved" ? "attempting" : "solved",
      });
      if (!result.success) {
        feedback.showError("Unable to update status", result.error);
        return;
      }
      router.refresh();
    });
  }

  function addSolution(formData: FormData) {
    startTransition(async () => {
      const result = await createSolutionAction(entry.id, {
        title: String(formData.get("title") ?? "Solution"),
        language: String(formData.get("language") ?? "typescript"),
        bodyMd: String(formData.get("bodyMd") ?? ""),
      });
      if (!result.success) {
        feedback.showError("Unable to add solution", result.error);
        return;
      }
      feedback.showSuccess("Solution added", "Your solution was saved.");
      router.refresh();
    });
  }

  function removeProblem() {
    startTransition(async () => {
      const result = await deleteUserProblemAction(entry.id);
      if (!result.success) {
        feedback.showError("Unable to delete problem", result.error);
        return;
      }
      router.push("/journal");
    });
  }

  function refreshFromLeetcode() {
    startTransition(async () => {
      const result = await refreshProblemFromLeetcodeAction(entry.problem.id);
      if (!result.success) {
        feedback.showError("Refresh failed", result.error);
        return;
      }
      feedback.showSuccess(
        "Problem refreshed",
        "Description, topics, and metadata were updated from LeetCode.",
      );
      router.refresh();
    });
  }

  function removeSolution(solutionId: string) {
    startTransition(async () => {
      const result = await deleteSolutionAction(solutionId);
      if (!result.success) {
        feedback.showError("Unable to delete solution", result.error);
        return;
      }
      router.refresh();
    });
  }

  const hasDescription = entry.problem.descriptionMd.trim().length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{entry.problem.title}</CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={difficultyBadgeVariant(entry.problem.difficulty)}>
                {entry.problem.difficulty}
              </Badge>
              <Badge>{entry.status}</Badge>
              {entry.problem.problemTopics.length > 0 ? (
                entry.problem.problemTopics.map((topic) => (
                  <Badge key={topic.topicId}>{topic.topic.name}</Badge>
                ))
              ) : (
                <Badge>No topics yet</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href={entry.problem.url} target="_blank">
                <ExternalLink className="h-4 w-4" />
                Open
              </Link>
            </Button>
            {entry.problem.source === "leetcode" ? (
              <Button
                variant="secondary"
                onClick={refreshFromLeetcode}
                disabled={isPending}
              >
                Refresh
              </Button>
            ) : null}
            <Button variant="secondary" onClick={toggleStatus} disabled={isPending}>
              Mark {entry.status === "solved" ? "attempting" : "solved"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hasDescription ? (
            <MarkdownViewer content={entry.problem.descriptionMd} />
          ) : (
            <p className="text-sm text-white/60">
              Description unavailable. Use Refresh to fetch it from LeetCode, or
              edit the shared problem manually.
            </p>
          )}
          {entry.problem.problemCompanies.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {entry.problem.problemCompanies.map((company) => (
                <Badge key={company.companyId}>{company.company.name}</Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal notes</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveNotes} className="space-y-4">
            <MarkdownEditor
              name="notesMd"
              defaultValue={entry.notesMd}
              placeholder="Your notes in markdown..."
            />
            <div className="space-y-2">
              <Label>Personal tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        setSelectedTags((current) =>
                          active
                            ? current.filter((id) => id !== tag.id)
                            : [...current, tag.id],
                        )
                      }
                      className="rounded-full border px-3 py-1 text-xs"
                      style={{
                        borderColor: active ? tag.color : "rgba(255,255,255,0.15)",
                        backgroundColor: active ? `${tag.color}33` : "transparent",
                      }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button type="submit" disabled={isPending}>
              Save notes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solutions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {entry.solutions.map((solution) => (
            <div
              key={solution.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{solution.title}</p>
                  <p className="text-sm text-white/50">{solution.language}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSolution(solution.id)}
                  disabled={isPending}
                >
                  Delete
                </Button>
              </div>
              <MarkdownViewer content={solution.bodyMd} />
            </div>
          ))}

          <form action={addSolution} className="space-y-4 border-t border-white/10 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue="Main solution" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input id="language" name="language" defaultValue="typescript" />
              </div>
            </div>
            <MarkdownEditor
              name="bodyMd"
              placeholder="```typescript\n// your solution\n```"
            />
            <Button type="submit" disabled={isPending}>
              Add solution
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from journal?</DialogTitle>
            <DialogDescription>
              This removes the problem from your journal only. The shared
              library entry stays available for other users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                setConfirmDeleteOpen(false);
                removeProblem();
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
