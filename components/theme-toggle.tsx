"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
export const ThemeToggle = (): React.JSX.Element => {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      aria-label="Toggle dark mode"
      className="h-11 gap-2 px-2"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-5!" />
      <span
        aria-hidden="true"
        className="relative h-6 w-11 rounded-full bg-primary shadow-inner"
      >
        <span className="absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition-transform dark:translate-x-5" />
      </span>
      <Moon className="size-5! text-muted-foreground" />
    </Button>
  );
};
