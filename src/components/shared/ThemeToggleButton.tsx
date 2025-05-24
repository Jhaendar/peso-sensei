
"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggleButton() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  if (!mounted) {
    // Render a placeholder or null during server-side rendering / hydration
    return <Button variant="outline" size="icon" className="h-9 w-9" disabled><Laptop className="h-[1.2rem] w-[1.2rem]" /></Button>;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9" // Adjusted size for better fit in navbar
      onClick={cycleTheme}
      aria-label="Toggle theme"
    >
      {theme === "light" && <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />}
      {theme === "dark" && <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />}
      {(theme === "system" || !theme) && <Laptop className="h-[1.2rem] w-[1.2rem] transition-all" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
