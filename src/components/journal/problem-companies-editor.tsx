"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCompaniesInput } from "@/lib/leetcode-difficulty";

export interface ProblemCompanyDraft {
  slug: string;
  name: string;
}

interface ProblemCompaniesEditorProps {
  initial?: string;
  onSubmit: (companies: ProblemCompanyDraft[]) => void;
  onCancel?: () => void;
  submitLabel?: string;
  pending?: boolean;
}

export function ProblemCompaniesEditor({
  initial = "",
  onSubmit,
  onCancel,
  submitLabel = "Save companies",
  pending = false,
}: ProblemCompaniesEditorProps) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const companiesText = String(formData.get("companiesText") ?? "");
    onSubmit(parseCompaniesInput(companiesText));
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="problem-companies">Companies</Label>
        <Input
          id="problem-companies"
          name="companiesText"
          defaultValue={initial}
          placeholder="Google, Amazon, Meta"
        />
        <p className="text-xs text-muted">Separate company names with commas.</p>
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
