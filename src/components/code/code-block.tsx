"use client";

import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { highlightCode } from "@/lib/highlight";
import {
  extractSolutionCode,
  getSolutionLanguageLabel,
} from "@/lib/solution-languages";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
  className?: string;
  actions?: React.ReactNode;
}

export function CodeBlock({
  code,
  language,
  title,
  className,
  actions,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const source = useMemo(() => extractSolutionCode(code), [code]);
  const highlighted = useMemo(
    () => highlightCode(source, language),
    [source, language],
  );
  const lines = source.split("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[22px] bg-code-bg text-[13px] leading-6 text-[#e6edf3]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/85">
            {getSolutionLanguageLabel(language)}
          </span>
          {title ? (
            <span className="truncate text-sm font-medium text-white/90">
              {title}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copy}
            className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          {actions}
        </div>
      </div>
      <div className="max-h-[520px] overflow-auto">
        <div className="grid min-w-full grid-cols-[auto_1fr]" style={{ width: "max-content" }}>
          <div
            aria-hidden
            className="select-none border-r border-white/5 py-4 pl-4 pr-3 text-right font-mono text-white/30"
          >
            {lines.map((_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>
          <pre className="m-0 whitespace-pre py-4 pl-4 pr-6 font-mono">
            <code
              className={`hljs language-${language} !bg-transparent !p-0`}
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      </div>
    </div>
  );
}
