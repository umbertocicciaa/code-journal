"use client";

import { useState } from "react";
import { CodeEditor } from "@/components/code/code-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  DEFAULT_SOLUTION_LANGUAGE,
  getStarterTemplate,
  isSolutionLanguage,
  SOLUTION_LANGUAGES,
  type SolutionLanguageId,
} from "@/lib/solution-languages";

export interface SolutionDraft {
  title: string;
  language: SolutionLanguageId;
  code: string;
}

interface SolutionEditorProps {
  initial?: Partial<SolutionDraft>;
  onSubmit: (draft: SolutionDraft) => void;
  onCancel?: () => void;
  submitLabel?: string;
  pending?: boolean;
}

export function SolutionEditor({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save solution",
  pending = false,
}: SolutionEditorProps) {
  const initialLanguage = initial?.language ?? DEFAULT_SOLUTION_LANGUAGE;
  const [title, setTitle] = useState(initial?.title ?? "Main solution");
  const [language, setLanguage] = useState<SolutionLanguageId>(initialLanguage);
  const [code, setCode] = useState(
    initial?.code ?? getStarterTemplate(initialLanguage),
  );

  function changeLanguage(next: string) {
    if (!isSolutionLanguage(next)) {
      return;
    }
    const currentTemplate = getStarterTemplate(language);
    const untouched = code.trim() === "" || code === currentTemplate;
    setLanguage(next);
    if (untouched) {
      setCode(getStarterTemplate(next));
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ title: title.trim() || "Solution", language, code });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <div className="space-y-2">
          <Label htmlFor="solution-title">Title</Label>
          <Input
            id="solution-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Two-pointer approach"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="solution-language">Language</Label>
          <Select
            id="solution-language"
            value={language}
            onChange={(event) => changeLanguage(event.target.value)}
          >
            {SOLUTION_LANGUAGES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <CodeEditor value={code} onChange={setCode} language={language} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Tab indents · Shift+Tab outdents · Enter keeps indentation
        </p>
        <div className="flex gap-2">
          {onCancel ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={pending || code.trim().length === 0}>
            {pending ? "Saving..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
