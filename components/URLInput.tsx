"use client";

import { useState, useRef } from "react";

interface URLInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export default function URLInput({ onSubmit, isLoading }: URLInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validateUrl = (value: string): boolean => {
    const patterns = [
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
      /^(https?:\/\/)?youtu\.be\/[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
    ];
    return patterns.some((p) => p.test(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    if (!validateUrl(url.trim())) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    onSubmit(url.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setError("");
      if (validateUrl(text)) {
        onSubmit(text);
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl">
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            placeholder="Paste YouTube URL here..."
            disabled={isLoading}
            className="h-13 w-full rounded-2xl bg-[var(--surface)] px-5 pr-12 text-sm text-[var(--foreground)]
                       shadow-[var(--shadow-soft)] placeholder:text-[var(--subtle)] transition-all duration-200
                       disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-[var(--ring)]"
          />
          <button
            type="button"
            onClick={handlePaste}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--muted)]
                       transition-colors duration-150 hover:bg-[var(--surface-hover)] hover:text-[var(--muted-strong)] disabled:opacity-50"
            title="Paste from clipboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            </svg>
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="flex h-13 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 text-sm font-medium text-white
                     shadow-lg shadow-red-500/20 transition-all duration-200 hover:bg-[var(--accent-hover)]
                     disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.97]"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>Fetching...</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span>Fetch</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-3 pl-1 text-sm text-[var(--accent)]">{error}</p>
      )}
    </form>
  );
}

