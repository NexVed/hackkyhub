import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { ResendOTP } from "./ResendOTP";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // GitHub now returns an `iss` parameter on the OAuth callback (RFC 9207).
    // Without a matching issuer here the callback is rejected with
    // 'unexpected "iss" (issuer) response parameter value'.
    GitHub({ issuer: "https://github.com/login/oauth" }),
    Google,
    Password,
    ResendOTP,
  ],
});
