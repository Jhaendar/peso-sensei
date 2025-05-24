
"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggleButton() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-md border p-0.5">
      <Button
        variant={theme === "light" ? "secondary" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => setTheme("light")}
        aria-label="Switch to light theme"
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Light</span>
      </Button>
      <Button
        variant={theme === "dark" ? "secondary" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => setTheme("dark")}
        aria-label="Switch to dark theme"
      >
        <Moon className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Dark</span>
      </Button>
      <Button
        variant={theme === "system" ? "secondary" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => setTheme("system")}
        aria-label="Switch to system theme"
      >
        <Laptop className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">System</span>
      </Button>
    </div>
  );
}
