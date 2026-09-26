"use client";

import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ProblemDescriptionEditorProps {
  initial?: string;
  onSubmit: (descriptionMd: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
  pending?: boolean;
}

export function ProblemDescriptionEditor({
  initial = "",
  onSubmit,
  onCancel,
  submitLabel = "Save description",
  pending = false,
}: ProblemDescriptionEditorProps) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit(String(formData.get("descriptionMd") ?? ""));
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="problem-description">Description</Label>
        <MarkdownEditor
          id="problem-description"
          name="descriptionMd"
          defaultValue={initial}
          placeholder="Write the problem description in markdown..."
        />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
