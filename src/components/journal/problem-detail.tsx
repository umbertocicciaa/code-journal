"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  DEFAULT_SOLUTION_LANGUAGE,
  isSolutionLanguage,
} from "@/lib/solution-languages";
import { CodeBlock } from "@/components/code/code-block";
import { SolutionEditor, type SolutionDraft } from "@/components/code/solution-editor";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { MarkdownViewer } from "@/components/markdown/markdown-viewer";
import { useFeedback } from "@/components/feedback/feedback-provider";
import { Badge, difficultyBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { findUserProblemById } from "@/server/repositories/user-problems";
import {
  createSolutionAction,
  deleteSolutionAction,
  updateSolutionAction,
  deleteUserProblemAction,
  refreshProblemFromLeetcodeAction,
  updateUserProblemAction,
} from "@/server/actions/journal-actions";

interface ProblemDetailProps {
  entry: NonNullable<Awaited<ReturnType<typeof findUserProblemById>>>;
  tags: Array<{ id: string; name: string; color: string }>;
}

export function ProblemDetail({ entry, tags }: ProblemDetailProps) {
  const router = useRouter();
  const feedback = useFeedback();
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(entry.solutions.length === 0);
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

  const [editingSolutionId, setEditingSolutionId] = useState<string | null>(null);

  function addSolution(draft: SolutionDraft) {
    startTransition(async () => {
      const result = await createSolutionAction(entry.id, {
        title: draft.title,
        language: draft.language,
        bodyMd: draft.code,
      });
      if (!result.success) {
        feedback.showError("Unable to add solution", result.error);
        return;
      }
      feedback.showSuccess("Solution added", "Your solution was saved.");
      setEditorOpen(false);
      router.refresh();
    });
  }

  function editSolution(draft: SolutionDraft) {
    if (!editingSolutionId) {
      return;
    }
    startTransition(async () => {
      const result = await updateSolutionAction(editingSolutionId, {
        title: draft.title,
        language: draft.language,
        bodyMd: draft.code,
      });
      if (!result.success) {
        feedback.showError("Unable to update solution", result.error);
        return;
      }
      feedback.showSuccess("Solution updated", "Your solution changes were saved.");
      setEditingSolutionId(null);
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
  const isSolved = entry.status === "solved";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-2xl md:text-3xl">{entry.problem.title}</CardTitle>
            <p className="mt-1 font-mono text-xs text-muted">{entry.problem.slug}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={difficultyBadgeVariant(entry.problem.difficulty)}>
                {entry.problem.difficulty}
              </Badge>
              <Badge variant={isSolved ? "accent" : "outline"}>
                {isSolved ? "Solved" : "Attempting"}
              </Badge>
              {entry.problem.problemTopics.length > 0 ? (
                entry.problem.problemTopics.map((topic) => (
                  <Badge key={topic.topicId}>{topic.topic.name}</Badge>
                ))
              ) : (
                <Badge variant="outline">No topics yet</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href={entry.problem.url} target="_blank">
                <ExternalLink className="h-4 w-4" />
                Open
              </Link>
            </Button>
            {entry.problem.source === "leetcode" ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={refreshFromLeetcode}
                disabled={isPending}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            ) : null}
            <Button
              variant={isSolved ? "secondary" : "accent"}
              size="sm"
              onClick={toggleStatus}
              disabled={isPending}
            >
              {isSolved ? "Mark attempting" : "Mark solved"}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-9 w-9"
              aria-label="Remove from journal"
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
            <p className="text-sm text-muted">
              Description unavailable. Use Refresh to fetch it from LeetCode, or
              edit the shared problem manually.
            </p>
          )}
          {entry.problem.problemCompanies.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
              {entry.problem.problemCompanies.map((company) => (
                <Badge key={company.companyId} variant="outline">
                  {company.company.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Solutions</CardTitle>
            <CardDescription>
              {entry.solutions.length === 0
                ? "No solutions yet. Pick a language and write your first one."
                : `${entry.solutions.length} saved solution${entry.solutions.length === 1 ? "" : "s"}`}
            </CardDescription>
          </div>
          {!editorOpen ? (
            <Button size="sm" onClick={() => setEditorOpen(true)}>
              <Plus className="h-4 w-4" />
              New solution
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5">
          {editorOpen ? (
            <div className="rounded-[24px] border border-line bg-card-muted p-4 md:p-5">
              <SolutionEditor
                onSubmit={addSolution}
                onCancel={
                  entry.solutions.length > 0 ? () => setEditorOpen(false) : undefined
                }
                pending={isPending}
              />
            </div>
          ) : null}

          {entry.solutions.map((solution) =>
            editingSolutionId === solution.id ? (
              <div key={solution.id} className="rounded-[24px] border border-line bg-card-muted p-4 md:p-5">
                <SolutionEditor
                  initial={{
                    title: solution.title,
                    language: isSolutionLanguage(solution.language)
                      ? solution.language
                      : DEFAULT_SOLUTION_LANGUAGE,
                    code: solution.bodyMd,
                  }}
                  onSubmit={editSolution}
                  onCancel={() => setEditingSolutionId(null)}
                  submitLabel="Update solution"
                  pending={isPending}
                />
              </div>
            ) : (
              <CodeBlock
                key={solution.id}
                code={solution.bodyMd}
                language={solution.language}
                title={solution.title}
                actions={
                  <>
                    <button
                      type="button"
                      onClick={() => setEditingSolutionId(solution.id)}
                      disabled={isPending}
                      aria-label={`Edit solution ${solution.title}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSolution(solution.id)}
                      disabled={isPending}
                      aria-label={`Delete solution ${solution.title}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                }
              />
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal notes</CardTitle>
          <CardDescription>Approach, pitfalls, and what to remember next time.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveNotes} className="space-y-4">
            <MarkdownEditor
              name="notesMd"
              defaultValue={entry.notesMd}
              placeholder="Your notes in markdown..."
            />
            {tags.length > 0 ? (
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
                        className="rounded-full border px-3 py-1 text-xs font-medium transition"
                        style={{
                          borderColor: active ? tag.color : "var(--line)",
                          backgroundColor: active ? `${tag.color}22` : "transparent",
                          color: active ? tag.color : "var(--muted)",
                        }}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <Button type="submit" disabled={isPending}>
              Save notes
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
