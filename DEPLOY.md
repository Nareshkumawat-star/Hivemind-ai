# Deploying Hivemind AI (free tier)

The whole app runs as **one Render web service** that serves both the API and the
built React app. `render.yaml` describes it, so Render provisions it from this repo.

## Why one service

| Constraint | Number |
| --- | --- |
| Render free instance hours per workspace per month | 750 |
| Hours in a month | ~730 |
| Always-on services that fit | **1** |

The old design (gateway + 4 services behind AWS ECR/ECS) needed five always-on
instances, and Render free instances *cannot receive private network traffic*,
so those four services could not be reached even if the hours existed.

Serving the SPA from the same origin also keeps the session cookie first-party,
which matters because `auth.controller.js` sets `sameSite: "strict"`.

## Deploy steps

1. **Connect Render** - dashboard > *New* > *Blueprint* > pick this repo.
   Render reads `render.yaml` and creates the `hivemind-ai` free web service.
2. **Create the free data services and copy their URLs into Render's env tab:**
   - **MongoDB Atlas** free M0 cluster -> `MONGODB_URI`
   - **Upstash Redis** free database -> `REDIS_URL`
     (prefer Upstash over Render Key Value: the free Key Value instance is 25 MB
     and loses all data on every restart, so sessions would drop)
   - **Qdrant Cloud** free cluster -> `QDRANT_URL` and `QDRANT_API_KEY`
3. **Firebase** - `serviceAccountKey.json` is gitignored, so it can never ship.
   Base64-encode it and paste the result:
   ```bash
   base64 -w0 backend/services/auth/serviceAccountKey.json
   ```
   Store as `FIREBASE_SERVICE_ACCOUNT_BASE64`.
4. **Provider keys** - the agent fleet needs:
   `GROQ_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`, `TAVILY_API_KEY`.
5. **Payments** - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
6. **File storage** - nothing to set. Generated PPT/PDF/image files are stored
   in MongoDB and served by the app itself at `GET /api/files/:key` (random
   UUID keys, auto-deleted after 7 days). The old S3 variables (`AWS_REGION`,
   `AWS_ACCESS_KEY_ID`, `AWS_SECRET_KEY`, `AWS_BUCKET_NAME`) are no longer
   used - the access key in circulation had been deleted from AWS, which broke
   all three generators.
7. **Frontend build vars** - `VITE_FIREBASE_API_KEY` and `VITE_RAZORPAY_KEY_ID`.
   These are inlined at build time, so they must be set *before* the build.
   Do **not** set `VITE_SERVER_URL` - leaving it unset is what makes API calls
   relative and keeps everything same-origin.

Deploys then happen automatically on every push to `main`.

## Avoiding the 15-minute spin-down

Free web services sleep after 15 minutes without inbound traffic (~1 min cold
start). `healthCheckPath: /api/health` does **not** prevent this - Render's own
health checks are internal and only run against *running* instances.

Add an external monitor (UptimeRobot or cron-job.org) pinging
`https://<your-service>.onrender.com/api/health` every 10-14 minutes.

Keeping one service awake 24/7 costs ~730 of the 750 free hours, so it still
fits - but it leaves no room for a second free service.

## Local development

```bash
cd backend && npm install && npm start   # http://localhost:10000
cd frontend && npm install && npm run dev
```

The server reads `backend/../.env` via `dotenv/config`. With no env vars set it
still boots: `/api/health` and the SPA are served, and features that need a
missing secret fail with a clear error rather than crashing the process.

## Notes

- The microservice layout files (per-service `package.json`s, all `Dockerfile`s,
  `docker-compose.yml`, and the `services/*/index.js` entrypoints) have been
  deleted. The merged app installs everything from `backend/package.json`.
  The remaining `backend/services/*` and `backend/gateway` directories only hold
  code that the merged app imports.
- Render's free tier is explicitly not for production use.
