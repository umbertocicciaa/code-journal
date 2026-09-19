"use client";

import { Download, FileJson, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useFeedback } from "@/components/feedback/feedback-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { JournalImportSummary } from "@/server/services/journal-transfer";

interface ImportResponse {
  summary?: JournalImportSummary;
  error?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function JournalTransfer() {
  const router = useRouter();
  const feedback = useFeedback();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<JournalImportSummary | null>(null);

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    setSummary(null);
    setFile(event.target.files?.[0] ?? null);
  }

  async function runImport() {
    if (!file) {
      return;
    }
    setImporting(true);
    setSummary(null);

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("overwriteExisting", String(overwrite));

      const response = await fetch("/api/journal/import", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as ImportResponse;

      if (!response.ok || !data.summary) {
        feedback.showError(
          "Import failed",
          data.error ?? "Something went wrong while importing.",
        );
        return;
      }

      setSummary(data.summary);
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      feedback.showSuccess(
        "Import complete",
        `${data.summary.created} added, ${data.summary.updated} updated, ${data.summary.skipped} skipped.`,
      );
      router.refresh();
    } catch (error) {
      console.error("journal import request failed:", error);
      feedback.showError("Import failed", "Could not reach the server.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export & import</CardTitle>
        <CardDescription>
          Back up your journal as JSON or restore it on another instance.
          Problems, notes, tags, solutions, Leitner state and review history are included.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col justify-between gap-4 rounded-[24px] bg-ink p-5 text-ink-foreground">
          <div>
            <p className="font-medium">Export</p>
            <p className="mt-1 text-sm text-white/60">
              Downloads a <code className="font-mono text-xs">code-journal-YYYY-MM-DD.json</code>{" "}
              file with everything in your journal.
            </p>
          </div>
          <Button asChild variant="accent" className="self-start">
            <a href="/api/journal/export" download>
              <Download className="h-4 w-4" />
              Download JSON
            </a>
          </Button>
        </div>

        <div className="flex flex-col gap-4 rounded-[24px] border border-line bg-card-muted p-5">
          <div>
            <p className="font-medium">Import</p>
            <p className="mt-1 text-sm text-muted">
              Merges a previous export into this journal. Nothing is deleted;
              solutions, tags and reviews are de-duplicated.
            </p>
          </div>

          <input
            ref={inputRef}
            id="journal-import-file"
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={pickFile}
          />
          <label
            htmlFor="journal-import-file"
            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-line bg-card px-4 py-3 text-sm transition hover:border-ink/40"
          >
            <FileJson className="h-5 w-5 shrink-0 text-muted" />
            {file ? (
              <span className="min-w-0">
                <span className="block truncate font-medium">{file.name}</span>
                <span className="text-xs text-muted">{formatBytes(file.size)}</span>
              </span>
            ) : (
              <span className="text-muted">Choose a .json export…</span>
            )}
          </label>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="journal-import-overwrite">Overwrite existing entries</Label>
              <p className="text-xs text-muted">
                Replace status, notes and Leitner state of problems already in your journal.
              </p>
            </div>
            <Switch
              id="journal-import-overwrite"
              checked={overwrite}
              onCheckedChange={setOverwrite}
            />
          </div>

          <Button
            onClick={runImport}
            disabled={!file || importing}
            className="self-start"
          >
            <Upload className="h-4 w-4" />
            {importing ? "Importing…" : "Import journal"}
          </Button>

          {summary ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-2xl border border-line bg-card p-4 text-sm sm:grid-cols-3">
              <SummaryItem label="Added" value={summary.created} />
              <SummaryItem label="Updated" value={summary.updated} />
              <SummaryItem label="Skipped" value={summary.skipped} />
              <SummaryItem label="Solutions" value={summary.solutionsAdded} />
              <SummaryItem label="Reviews" value={summary.reviewLogsAdded} />
              <SummaryItem label="New tags" value={summary.tagsCreated} />
            </dl>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
