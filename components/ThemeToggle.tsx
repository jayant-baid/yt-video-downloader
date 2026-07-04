"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem("theme") as Theme | null;
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("theme", nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--surface)] px-3 text-sm font-medium
                 text-[var(--foreground)] shadow-[var(--shadow-soft)] transition-all duration-200
                 hover:bg-[var(--surface-hover)] active:scale-[0.98]
                 focus:outline-none focus:ring-4 focus:ring-[var(--ring)]"
    >
      <span className="relative h-5 w-9 rounded-full bg-[var(--surface-hover)] shadow-inner">
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-[var(--foreground)] transition-transform duration-200 ${
            theme === "light" ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className="hidden sm:inline">{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
