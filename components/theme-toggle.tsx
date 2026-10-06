"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
export const ThemeToggle = (): React.JSX.Element => {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11 lg:size-9"
      aria-label="Toggle dark mode"
      data-attr="theme-toggle"
      title="Switch theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun
        aria-hidden="true"
        className="hidden size-[18px] dark:block"
        strokeWidth={1.7}
      />
      <Moon
        aria-hidden="true"
        className="size-[18px] dark:hidden"
        strokeWidth={1.7}
      />
    </Button>
  );
};
