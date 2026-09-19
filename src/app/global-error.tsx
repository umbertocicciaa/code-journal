"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#07070d] px-6 text-white">
        <div className="max-w-md rounded-3xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur-2xl">
          <h1 className="text-xl font-semibold">Application error</h1>
          <p className="mt-2 text-sm text-white/70">
            Code Journal hit an unexpected error.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-2xl bg-white/20 px-4 py-2 text-sm"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
