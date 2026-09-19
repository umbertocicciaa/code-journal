"use client";

import { useMemo, useRef } from "react";
import { highlightCode } from "@/lib/highlight";
import { cn } from "@/lib/utils";

const TAB = "    ";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder?: string;
  className?: string;
  minLines?: number;
  name?: string;
  id?: string;
}

export function CodeEditor({
  value,
  onChange,
  language,
  placeholder = "// Write your solution here",
  className,
  minLines = 14,
  name,
  id,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const highlighted = useMemo(
    () => highlightCode(value, language),
    [value, language],
  );

  const lineCount = Math.max(minLines, value.split("\n").length);
  const lineNumbers = useMemo(
    () => Array.from({ length: lineCount }, (_, index) => index + 1),
    [lineCount],
  );

  function insertAtSelection(insert: string, moveCaretBy = insert.length) {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const { selectionStart, selectionEnd } = textarea;
    const next =
      value.slice(0, selectionStart) + insert + value.slice(selectionEnd);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd =
        selectionStart + moveCaretBy;
    });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const textarea = event.currentTarget;

    if (event.key === "Tab") {
      event.preventDefault();
      if (event.shiftKey) {
        const lineStart = value.lastIndexOf("\n", textarea.selectionStart - 1) + 1;
        const line = value.slice(lineStart, textarea.selectionStart);
        const leading = line.match(/^ {1,4}/)?.[0].length ?? 0;
        if (leading > 0) {
          const next =
            value.slice(0, lineStart) + value.slice(lineStart + leading);
          const caret = textarea.selectionStart - leading;
          onChange(next);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = caret;
          });
        }
        return;
      }
      insertAtSelection(TAB);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const lineStart = value.lastIndexOf("\n", textarea.selectionStart - 1) + 1;
      const currentLine = value.slice(lineStart, textarea.selectionStart);
      const indent = currentLine.match(/^\s*/)?.[0] ?? "";
      const previousChar = value.charAt(textarea.selectionStart - 1);
      const extra = /[{(\[:]$/.test(previousChar) ? TAB : "";
      insertAtSelection(`\n${indent}${extra}`);
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[22px] border border-white/5 bg-code-bg text-[13px] leading-6 text-[#e6edf3]",
        className,
      )}
    >
      <div className="max-h-[560px] overflow-auto">
        <div className="grid min-w-full grid-cols-[auto_1fr]" style={{ width: "max-content" }}>
          <div
            aria-hidden
            className="select-none border-r border-white/5 py-4 pl-4 pr-3 text-right font-mono text-white/30"
          >
            {lineNumbers.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
          <div className="relative min-w-0 py-4 pl-4 pr-6">
            <pre
              aria-hidden
              className="pointer-events-none m-0 whitespace-pre font-mono"
              style={{ minHeight: `${lineCount * 1.5}rem` }}
            >
              <code
                className={`hljs language-${language} !bg-transparent !p-0`}
                dangerouslySetInnerHTML={{ __html: `${highlighted}\n` }}
              />
            </pre>
            <textarea
              ref={textareaRef}
              id={id}
              name={name}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={value ? undefined : placeholder}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              wrap="off"
              className="code-editor-textarea absolute inset-0 m-0 h-full w-full resize-none overflow-hidden whitespace-pre bg-transparent py-4 pl-4 pr-6 font-mono outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
