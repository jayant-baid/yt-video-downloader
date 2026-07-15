'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = window.localStorage.getItem('theme');
    const initialTheme: Theme = stored === 'light' || stored === 'dark' ? stored : 'dark';

    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-[var(--surface)] p-0 text-[var(--foreground)] transition-colors duration-200 hover:bg-[var(--surface-hover)] hover:shadow-[0_0_0_2px_var(--ring)]"
    >
      <div
        className={`flex items-center justify-center transition-transform duration-500 ${isDark ? 'rotate-0' : 'rotate-360'}`}
      >
        {isDark ? <Moon size={18} /> : <Sun size={18} />}
      </div>
    </button>
  );
}
