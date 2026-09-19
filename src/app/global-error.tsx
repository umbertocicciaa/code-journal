"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#0f0f0f] px-6 font-sans text-[#161616]">
        <div className="max-w-md rounded-[28px] border border-[#e6e6e2] bg-white p-8 text-center">
          <h1 className="text-xl font-semibold">Application error</h1>
          <p className="mt-2 text-sm text-[#7b7b78]">
            Code Journal hit an unexpected error.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 rounded-full bg-[#1b1b1b] px-5 py-2.5 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
