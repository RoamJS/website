"use client";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
const ConnectedAccount = (): React.JSX.Element => {
  const { isSignedIn, isLoaded } = useUser();
  return isSignedIn ? (
    <span data-ph-no-autocapture>
      <UserButton />
    </span>
  ) : (
    <SignInButton mode="modal">
      <Button variant="outline" size="sm" disabled={!isLoaded}>
        Sign in
      </Button>
    </SignInButton>
  );
};
export const AuthButton = ({
  enabled,
}: {
  enabled: boolean;
}): React.JSX.Element | null => (enabled ? <ConnectedAccount /> : null);
