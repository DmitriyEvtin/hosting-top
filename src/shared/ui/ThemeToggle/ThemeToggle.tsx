"use client";

import { useTheme } from "@/shared/lib/theme-context";
import { Moon, Sun } from "lucide-react";
import { Button } from "../Button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative h-9 w-9"
      aria-label="Переключить тему"
    >
      <Sun
        data-testid="sun-icon"
        className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
      />
      <Moon
        data-testid="moon-icon"
        className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
      />
      <span className="sr-only">Переключить тему</span>
    </Button>
  );
}
