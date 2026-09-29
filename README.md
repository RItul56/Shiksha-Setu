# ShikshaSetu AI

An offline-first learning PWA for students who need education to work with limited connectivity. The demo includes learner navigation, courses and lessons, AI doubt flow, scholarships, career exploration, mentorship, progress, profile and settings.

## Start locally

```bash
npm install
npm run dev
```

The demo is usable without a backend. To connect a FastAPI service, copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL`. Authentication uses cookie credentials when a backend is configured; the included demo sign-in uses mock profile state and does not persist a password.

## Offline demo

1. Open Courses while connected and download Python Fundamentals (or another course).
2. Open a lesson and mark it complete. Content and progress are stored in IndexedDB through Dexie.
3. Disconnect the network and reopen the saved lesson. The progress update remains in the sync queue.
4. Reconnect to run the sync manager. With no backend configured, queued demo changes are acknowledged locally; with a backend configured, they are posted to `/sync/:entity`.

The PWA precaches the application shell and static files. Images use a bounded cache; large video files are not cached or automatically loaded. The Install app button is shown where the browser supports installation.

## Structure

- `src/app` — routes, page layouts and reusable screen components
- `src/services/api` — Axios client and mock-backed course/scholarship service boundary
- `src/services/offline` — Dexie database, content download, queue and reconnection sync
- `src/store` — Zustand preferences and demo user state
- `src/i18n` — English/Hindi UI resources, with extension points for Marathi and Bengali
- `src/data/mockData.ts` — realistic demo courses, lessons, mentors and scholarships

No model API key is shipped in the browser. AI calls go through the configured backend; a small local demo answer set is used only when the service is unavailable while connected. Offline questions are saved and queued, and the UI explains that AI itself is not running offline.
