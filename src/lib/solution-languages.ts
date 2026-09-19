export const SOLUTION_LANGUAGES = [
  { id: "c", label: "C", hljs: "c", extension: "c" },
  { id: "cpp", label: "C++", hljs: "cpp", extension: "cpp" },
  { id: "java", label: "Java", hljs: "java", extension: "java" },
  { id: "python", label: "Python", hljs: "python", extension: "py" },
  { id: "rust", label: "Rust", hljs: "rust", extension: "rs" },
  { id: "ruby", label: "Ruby", hljs: "ruby", extension: "rb" },
  { id: "javascript", label: "JavaScript", hljs: "javascript", extension: "js" },
  { id: "typescript", label: "TypeScript", hljs: "typescript", extension: "ts" },
] as const;

export type SolutionLanguageId = (typeof SOLUTION_LANGUAGES)[number]["id"];

export const SOLUTION_LANGUAGE_IDS = SOLUTION_LANGUAGES.map(
  (language) => language.id,
) as [SolutionLanguageId, ...SolutionLanguageId[]];

export const DEFAULT_SOLUTION_LANGUAGE: SolutionLanguageId = "python";

export function isSolutionLanguage(value: string): value is SolutionLanguageId {
  return (SOLUTION_LANGUAGE_IDS as readonly string[]).includes(value);
}

export function getSolutionLanguage(id: string) {
  return SOLUTION_LANGUAGES.find((language) => language.id === id) ?? null;
}

export function getSolutionLanguageLabel(id: string): string {
  return getSolutionLanguage(id)?.label ?? id;
}

const STARTER_TEMPLATES: Record<SolutionLanguageId, string> = {
  c: `int solve(int* nums, int numsSize) {\n    \n}\n`,
  cpp: `class Solution {\npublic:\n    void solve() {\n        \n    }\n};\n`,
  java: `class Solution {\n    public void solve() {\n        \n    }\n}\n`,
  python: `class Solution:\n    def solve(self):\n        pass\n`,
  rust: `impl Solution {\n    pub fn solve() {\n        \n    }\n}\n`,
  ruby: `def solve\n  \nend\n`,
  javascript: `/**\n * @return {void}\n */\nvar solve = function() {\n    \n};\n`,
  typescript: `function solve(): void {\n    \n}\n`,
};

export function getStarterTemplate(id: SolutionLanguageId): string {
  return STARTER_TEMPLATES[id];
}

/**
 * Older solutions were stored as a fenced markdown block. Strip the fence so
 * the raw code can be displayed and edited directly.
 */
export function extractSolutionCode(body: string): string {
  const match = body.match(/^\s*```[\w+-]*\r?\n([\s\S]*?)\r?\n```\s*$/);
  return match ? match[1] : body;
}
