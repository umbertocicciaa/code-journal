import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

function resolveAuthBaseURL(): string | undefined {
  if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) {
    return process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return undefined;
}

export const authClient = createAuthClient({
  baseURL: resolveAuthBaseURL(),
  plugins: [usernameClient()],
});
