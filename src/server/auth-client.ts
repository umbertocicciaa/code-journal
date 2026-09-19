import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

function resolveAuthBaseURL(): string | undefined {
  // Same-origin in the browser so one image works behind any reverse-proxy domain.
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return (
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL
  );
}

export const authClient = createAuthClient({
  baseURL: resolveAuthBaseURL(),
  plugins: [usernameClient()],
});
