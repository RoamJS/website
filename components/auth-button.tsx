"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth-provider";
export const AuthButton = ({
  enabled,
}: {
  enabled: boolean;
}): React.JSX.Element | null => {
  const { user, isLoaded } = useAuth();
  if (!enabled) return null;
  return (
    <span data-ph-no-autocapture>
      <Button asChild variant="outline" size="sm" className="min-h-11">
        <Link href="/account" prefetch={false}>
          {!isLoaded ? "Account" : user ? "My account" : "Sign in"}
        </Link>
      </Button>
    </span>
  );
};
