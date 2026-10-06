import "server-only";
import { createClient } from "./supabase/server";
import { isAuthConfigured } from "./features";
import { verifiedPrimaryEmail } from "./validation";
export type VerifiedIdentity = { userId: string; email: string };
export const requireVerifiedIdentity = async (): Promise<
  VerifiedIdentity | Response
> => {
  if (!isAuthConfigured())
    return Response.json(
      { error: "Sign-in is not available yet." },
      { status: 503 },
    );
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user)
      return Response.json(
        { error: "Please sign in to continue." },
        { status: 401 },
      );
    const email = verifiedPrimaryEmail(user);
    if (!email)
      return Response.json(
        { error: "Verify your email before continuing." },
        { status: 403 },
      );
    return { userId: user.id, email };
  } catch {
    return Response.json(
      { error: "We couldn’t verify your account. Please try again." },
      { status: 503 },
    );
  }
};
