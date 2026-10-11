# ShikshaSetu AI

ShikshaSetu is an offline-friendly learning platform with a React/Vite client, Fastify API, and PostgreSQL storage for accounts, lesson progress, and study schedules.

## Start locally

Requirements for local development: Node.js 20+, pnpm, and PostgreSQL 16+ installed. Docker is optional for a containerized deployment.

1. Copy `.env.example` to `.env`. Set unique database credentials, a random `SESSION_SECRET` of at least 32 bytes, and an `ADMIN_EMAIL` plus a strong `ADMIN_PASSWORD` (at least 14 characters). Keep `.env` private.
2. Set `APP_ORIGIN=http://localhost:8080` for the Docker stack. Set `VITE_API_BASE_URL=/api`.
3. Run `docker compose up --build`. The web app is at `http://localhost:8080`; the API health endpoint is `/api/health`. The startup migration and seed jobs create schema, demo courses, and the optional admin account.

For local development, run `npm run dev` (or `pnpm dev`). The launcher uses the project's installed Node packages directly, so pnpm does not need to be on PATH. It creates an isolated PostgreSQL cluster in `.local-data/` on port 5447 with a least-privilege application role, writes a private `.env` with generated credentials, runs migrations and seed data, and starts both the API and Vite. The local admin email and generated password are printed once at first setup; they are also saved in `.env`. Keep both private. The local cluster is separate from any PostgreSQL service already installed on port 5432. `Ctrl+C` stops the API and web server; the local database stays running so student data is preserved and reused at the next start. Vite proxies `/api` to the API. For LAN access, the frontend origin is served by the Vite host; the browser uses that same origin for `/api`. Local development uses HTTP and is intended only for a trusted network. For real student accounts, deploy behind HTTPS using the Docker configuration, managed secrets, backups, and a reviewed production database. Demo mode is only for preview and should not contain real student data.

## Included features

- PostgreSQL accounts with bcrypt password hashes, expiring opaque server sessions, role-gated admin access, data export and account deletion. Learners can edit their profile and upload a compressed profile image.
- Student progress storage with login/learning-day streaks (a missed calendar day breaks the current streak), per-user weekly timetable CRUD, and server-side overlap checks.
- Learning progress charts, course catalog and lessons, offline cache and pending-change sync.
- Tutor endpoint that uses course lesson context with an optional OpenAI-compatible provider configured only on the server (`AI_PROVIDER_URL`, `AI_MODEL`, `AI_API_KEY`). Without provider credentials, it returns a course-grounded fallback rather than a generative chatbot.
- Admin dashboard with aggregate counts only; mentorship requests are saved per learner and can be cancelled.
- Responsive UI, English/Hindi preferences, cited creator videos and a weekly planner.

## AI and Kaggle data

The Kaggle xAPI-Edu-Data dataset is a small educational behavior/performance table, not a chatbot conversation corpus. Its 480 rows can support a research prototype engagement classifier, not conversational fine-tuning or reliable individual risk decisions. The included script trains a simple classifier on a limited set of engagement features and excludes demographic fields.

Review the dataset page and its CC BY-SA 4.0 attribution/share-alike terms before use. Download manually with Kaggle CLI after configuring your own Kaggle credentials:

```powershell
python -m pip install -r ml/requirements.txt
kaggle datasets download -d aljarah/xAPI-Edu-Data -p data --unzip
python ml/train_progress.py
```

The generated model stays in `ml/artifacts/` and is not connected to student production records or the chat endpoint. No model artifact is included until a dataset is deliberately downloaded and reviewed. Do not upload platform learner records to Kaggle or use model output as a high-impact decision.

Dataset: [Kaggle xAPI-Edu-Data](https://www.kaggle.com/datasets/aljarah/xAPI-Edu-Data).

## Credited learning videos

Each subject/course page offers curated public videos from their original creators. Embeds load only after a learner chooses to play; videos remain hosted by their creators:

- [CodeWithHarry — Python Tutorial for Beginners in Hindi](https://www.youtube.com/watch?v=gfDE2a7MKjA)
- [freeCodeCamp.org — Learn Python](https://www.youtube.com/watch?v=rfscVS0vtbw)
- [Khan Academy — Algebra](https://www.youtube.com/watch?v=_LDR1_Prveo)
- [BBC Learning English — Daily conversation](https://www.youtube.com/watch?v=bq6GBbh3uhU)
- [CrashCourse — Early computing](https://www.youtube.com/watch?v=O5nskjZ_GoI)
- [freeCodeCamp.org — HTML and CSS](https://www.youtube.com/watch?v=dX8396ZmSPk)

These links are included as supplementary resources, not copied course material. Channel names and links are visible in the app.

## Security and deployment boundaries

This repository implements layered safeguards: strict schema validation, parameterized SQL, bcrypt, opaque hashed sessions, HttpOnly/SameSite cookies, CSRF checks, CORS allowlisting, Helmet/CSP, request size/time limits, rate limits, role checks, and per-user row ownership. This is not a literal 16-level security certification or a guarantee against compromise. Before real student/minor data, have the system threat-modeled and independently reviewed, configure HTTPS and managed secret storage, backups/restore, retention and consent processes, audit/alerting, and incident response.

Docker Compose runs one API instance with a PostgreSQL connection pool and reverse proxy. It provides a starting point, not proof of handling thousands of simultaneous requests. Measure load on representative infrastructure, tune PostgreSQL and pool sizes, add a production ingress/cache/queue as needed, and scale stateless API replicas only after load and database capacity testing. No load test has been run here.

## Commands

- `pnpm dev` — Vite development client
- `pnpm build` — type-check and production client build
- `pnpm api:dev` — local API development
- `pnpm build:api` — type-check API
- `pnpm db:migrate` / `pnpm db:seed` — database setup
