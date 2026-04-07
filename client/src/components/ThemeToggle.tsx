import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/store/themeStore";
import { useEffect } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
    >
      {theme === "light" ? (
        <Sun className="h-5 w-5 text-neutral-500" />
      ) : (
        <Moon className="h-5 w-5 text-neutral-400" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
