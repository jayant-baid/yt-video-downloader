**YT Downloader**

A small, modern Next.js app to download YouTube videos and extract audio directly from the browser. It provides a clean UI to paste a YouTube URL, fetch available formats, and download video/audio via server-side worker routes.

**Features**
- **Paste + Fetch**: Paste a YouTube URL and fetch metadata and available formats.
- **Download Manager**: Background download queue with progress, statuses, and retry/cleanup actions.
- **Theme Toggle**: Light/dark theme with persisted preference.
- **API Routes**: App routes that orchestrate the download and serve files to the browser.

**Tech Stack**
- **Framework**: Next.js (App Router)
- **UI**: Tailwind CSS (utility classes)
- **Icons**: lucide-react
- **Language**: TypeScript

**Quick Start**

- Install dependencies:

```bash
npm install
```

- Run the dev server:

```bash
npm run dev
```

- Open http://localhost:3000 in your browser.

**Build for Production**

```bash
npm run build
npm start
```

**Repository Structure (key files)**
- **App entry**: [app/page.tsx](app/page.tsx)
- **Layout**: [app/layout.tsx](app/layout.tsx)
- **Theme toggle**: [components/ThemeToggle.tsx](components/ThemeToggle.tsx)
- **Download manager UI**: [components/DownloadManager.tsx](components/DownloadManager.tsx)
- **URL input + fetching**: [components/URLInput.tsx](components/URLInput.tsx)
- **Download logic**: [lib/downloadManager.ts](lib/downloadManager.ts)
- **yt-dlp wrapper**: [lib/ytdlp.ts](lib/ytdlp.ts)
- **API routes**: [app/api](app/api) — routes under `download` and `info`

**How It Works (high level)**

- The UI lets users paste a YouTube link and request available formats (client-side form in `components/URLInput.tsx`).
- The frontend calls app routes under `app/api` to prepare and run `yt-dlp` (see [lib/ytdlp.ts](lib/ytdlp.ts)).
- Downloads are tracked by the client via a small download manager hook and UI (`hooks/useDownloadManager.ts`, [components/DownloadManager.tsx](components/DownloadManager.tsx)).

**Environment & Configuration**

- There are no required environment variables for local dev by default. If you customize the downloader or add remote storage, document any new environment variables in this file.

**Notes & Troubleshooting**

- Hydration mismatches: components that read browser-only APIs (localStorage, Date, or window) must avoid accessing them during the first render. See `components/ThemeToggle.tsx` for an example of mount-safe initialization.
- If you see unexpected tracing or build warnings from Turbopack (during `npm run build`), check for dynamic filesystem access in server code (see the `lib/` folder).

**Development Tips**

- Use the browser DevTools to inspect the Download Manager and API responses.
- Add tests for `lib/ytdlp.ts` logic by mocking external process calls.

**Contributing**

- Feel free to open issues or pull requests. Keep changes small and focused. Document any new API routes or configuration.

**License**

- MIT (adjust as needed)

---

If you want, I can also add a short Usage guide with screenshots and a CONTRIBUTING.md template. Let me know what you'd like included.
