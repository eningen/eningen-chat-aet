import { createLovableAuth } from "@lovable.dev/cloud-auth-js";

const lovableAuth = createLovableAuth();

export type ChatAetOAuthProvider = "google" | "microsoft";

/**
 * Starts OAuth through the same Lovable Cloud authentication flow used by
 * the existing Stickman Video project. The Chat AET app itself does not
 * store provider secrets in the browser.
 */
export async function signInWithLovableOAuth(
  provider: ChatAetOAuthProvider,
  redirectUri = window.location.origin,
) {
  return lovableAuth.signInWithOAuth(provider, {
    redirect_uri: redirectUri,
  });
}
