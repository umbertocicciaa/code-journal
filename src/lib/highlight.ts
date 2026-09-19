import hljs from "highlight.js/lib/core";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import typescript from "highlight.js/lib/languages/typescript";
import { getSolutionLanguage } from "@/lib/solution-languages";

hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("java", java);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("typescript", typescript);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Returns highlighted HTML for the given code. Falls back to escaped plain
 * text when the language is unknown or highlighting fails.
 */
export function highlightCode(code: string, languageId: string): string {
  const language = getSolutionLanguage(languageId);
  if (!language) {
    return escapeHtml(code);
  }
  try {
    return hljs.highlight(code, {
      language: language.hljs,
      ignoreIllegals: true,
    }).value;
  } catch {
    return escapeHtml(code);
  }
}
