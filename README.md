# AI Resume Screening & Job Matching System

A full-stack MERN recruitment platform that reads PDF resumes, extracts candidate information with rule-based NLP, and ranks candidates against job descriptions using **TF-IDF vectorisation and cosine similarity**. Every match score is explainable: the UI shows the matched skills, the missing skills and the exact weighted formula behind the percentage.

Built as a college mini project for the Department of Computer Science and Engineering, Nalanda Institute of Technology, Bhubaneswar.

> This project does **not** auto-reject anyone. Scores are decision support only; every shortlist or rejection is a human recruiter decision.

---

## 1. Highlights

| Area | What is implemented |
|---|---|
| Authentication | Candidate / recruiter registration, JWT login, bcrypt hashing, role-based authorization, protected routes |
| Resume upload | PDF-only upload with MIME + magic-byte check, 5 MB limit, private storage, text extraction with pdf.js |
| Resume analysis | Name, email, phone, skills, education, experience, certifications, experience years, detected sections |
| Job management | Full CRUD for job posts with required/preferred skills, experience, education, salary, openings, status |
| AI matching | Dictionary skill extraction + TF-IDF + cosine similarity, weighted explainable score, matched/missing skills |
| Ranking | Ranked candidates per job, persisted `MatchResult` records, score distribution statistics |
| Recommendations | Every open job scored against the candidate's resume with gap analysis |
| Dashboards | Candidate workspace, recruiter pipeline chart, admin analytics with score distribution, top skills and activity feed |
| Applications | Apply with cover note, computed score snapshot, status workflow (applied / shortlisted / on-hold / rejected), withdraw |

No score anywhere in the app is hardcoded. `npm run check:nlp` prints the real numbers produced by the pipeline.

---

## 2. Technology stack

**Frontend** — React 18, Vite, React Router DOM, Axios, Tailwind CSS 3, Recharts, lucide-react
**Backend** — Node.js, Express 4, Mongoose 8, JWT (jsonwebtoken), bcryptjs, multer, express-validator, helmet, express-rate-limit
**Database** — MongoDB (local or MongoDB Atlas)
**NLP / matching** — pure JavaScript: pdfjs-dist (text layer), custom tokeniser, IDF, cosine similarity, skill dictionary

Everything runs on one JavaScript runtime. A Python microservice is **not** required: the matching workload (a handful of documents per request) is well within Node's reach, and keeping one language means one deployment, shared models and simpler debugging.

---

## 3. Folder structure

```
RESUME ANALYZER/
├── README.md
├── .gitignore
├── docs/
│   └── PROJECT_REPORT.md          # 24-chapter mini-project report
├── server/
│   ├── server.js                  # Express app + middleware + route mounting
│   ├── package.json
│   ├── .env.example               # copy to .env
│   ├── config/
│   │   └── db.js                  # Mongoose connection
│   ├── models/
│   │   ├── User.js                # auth account + bcrypt hook
│   │   ├── Candidate.js
│   │   ├── Recruiter.js
│   │   ├── Resume.js              # extracted text + analysis
│   │   ├── Job.js
│   │   ├── Application.js
│   │   └── MatchResult.js         # persisted scores
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── resumeController.js
│   │   ├── jobController.js
│   │   ├── matchController.js
│   │   ├── applicationController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js                # protect / optionalAuth / signToken
│   │   ├── role.js                # authorize(...roles)
│   │   ├── upload.js              # multer disk storage + PDF filter
│   │   ├── validate.js            # express-validator result handler
│   │   └── errorHandler.js        # 404 + central JSON errors
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── resumeRoutes.js
│   │   ├── jobRoutes.js
│   │   ├── matchRoutes.js
│   │   ├── applicationRoutes.js
│   │   └── adminRoutes.js
│   ├── services/
│   │   ├── pdfService.js          # pdf.js text extraction + line rebuild
│   │   ├── resumeParser.js        # contact / education / experience parsing
│   │   ├── skillDictionary.js     # ~110 canonical skills with aliases
│   │   ├── skillExtractor.js      # dictionary matching + pruning
│   │   ├── textProcessing.js      # normalise, tokenise, stopwords, bigrams
│   │   ├── tfidf.js               # IDF, vectors, cosine similarity
│   │   └── matchingService.js     # weighted score + ranking
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── asyncHandler.js
│   │   ├── pdfGenerator.js        # demo resumes (dev only)
│   │   └── sampleData.js          # demo resumes + jobs
│   ├── scripts/
│   │   ├── seed.js                # demo accounts, PDFs, jobs, applications
│   │   ├── nlpCheck.js            # parsing + matching console report (no DB)
│   │   ├── apiCheck.js            # end-to-end API smoke test
│   │   └── demoServer.js          # in-memory MongoDB + seed + API (optional)
│   └── uploads/                   # stored PDFs (git-ignored contents)
└── client/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env.example
    ├── public/favicon.svg
    └── src/
        ├── main.jsx
        ├── App.jsx                # all routes
        ├── index.css              # design system (buttons, cards, inputs)
        ├── assets/
        ├── assets/logo.svg        # brand mark used by the Logo component
        ├── services/              # api.js + auth/resume/job/match/application/admin
        ├── context/AuthContext.jsx
        ├── hooks/                 # useAuth, useFetch
        ├── utils/                 # roles.js, format.js
        ├── components/            # layout, guards, cards, modal, score bar, chips
        └── pages/                 # 14 route components (see section 8)
```

---

## 4. Prerequisites

- **Node.js 18+** (developed on Node 22)
- **npm 9+**
- **MongoDB** — either MongoDB Community Server locally or a free MongoDB Atlas cluster
- VS Code (recommended) and a modern browser

---

## 5. Installation (Windows / VS Code)

Open the project folder in VS Code, then use the integrated terminal (PowerShell or Git Bash).

### 5.1 Install backend dependencies

```powershell
cd server
npm install
copy .env.example .env
```

Edit `server/.env` and set at least `JWT_SECRET` (any long random string) and `MONGO_URI`.

### 5.2 Install frontend dependencies

```powershell
cd ..
cd client
npm install
copy .env.example .env
```

`client/.env` contains `VITE_API_URL=http://localhost:5000/api`.

> Shortcut for Git Bash / macOS / Linux: `cp .env.example .env` instead of `copy`.

---

## 6. MongoDB configuration

### Option A — local MongoDB (simplest for a demo)

1. Install **MongoDB Community Server** and optionally **MongoDB Compass**.
2. Start the service (Windows installs it as a service; otherwise run `mongod --dbpath C:\data\db`).
3. Keep this line in `server/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/resume_analyzer
```

The database and collections are created automatically on first write.

### Option B — MongoDB Atlas (cloud)

1. Create a free cluster at <https://www.mongodb.com/atlas>.
2. Create a database user (username + password).
3. Network Access → add your current IP (or `0.0.0.0/0` for a college demo only).
4. Connect → *Drivers* → copy the connection string and set:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/resume_analyzer?retryWrites=true&w=majority
```

URL-encode special characters in the password (for example `@` → `%40`).

### Option C — no MongoDB installed at all (optional)

```powershell
cd server
npm run demo
```

Starts an in-memory MongoDB, seeds the demo data and boots the API in one command. Data disappears when you stop the process — use Option A or B for persistence.

---

## 7. Create the administrator account

There are no demo accounts and no sample records. Candidates and recruiters create
their own accounts from the registration pages, then sign in.

With MongoDB running:

```powershell
cd server
npm run seed
```

This creates (or updates) the single administrator account and leaves every other
collection untouched:

| Role | Email | Password |
|---|---|---|
| Admin | `swavi@gmail.com` | `Suman@2005` |

> Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env` before deploying.

The administrator is the only account with platform-wide access: totals, score
distribution, top candidates with their emails, most requested skills, the activity
feed and the full user list with activate/deactivate controls.

### Removing all data again

```powershell
cd server
npm run reset:data
```

Deletes every candidate, recruiter, resume, job, application and match result, clears
the uploaded PDFs, and recreates the administrator account only.

### Optional sample dataset (development only)

Requires MongoDB running. This **wipes the collections** and loads the sample
candidates, recruiters, jobs, resumes and match results used in the evaluation:

```powershell
cd server
$env:SEED_DEMO=1; npm run seed
```

Leave `SEED_DEMO` unset for a clean, real-usage database.

---

## 8. Running the application

Two terminals, both from the project root:

**Terminal 1 — backend**

```powershell
cd server
npm run dev          # nodemon, http://localhost:5000
```

**Terminal 2 — frontend**

```powershell
cd client
npm run dev          # Vite, http://localhost:5173
```

Open <http://localhost:5173>.

Production build of the frontend:

```powershell
cd client
npm run build
npm run preview
```

### Pages

| # | Route | Purpose |
|---|---|---|
| 1 | `/` | Landing page |
| 2 | `/register/candidate` | Candidate registration |
| 3 | `/register/recruiter` | Recruiter registration |
| 4 | `/login` | Login (with demo account autofill) |
| 5 | `/candidate/dashboard` | Candidate dashboard |
| 6a | `/recruiter/dashboard` | Recruiter dashboard with pipeline chart |
| 6b | `/admin/dashboard` | Admin dashboard with analytics |
| 7 | `/candidate/upload` | Resume upload |
| 8 | `/candidate/analysis` | Resume analysis |
| 9 | `/jobs` | Job listing with search and filters |
| 10 | `/recruiter/jobs` | Job management (create/edit/delete) |
| 11 | `/recruiter/ranking` | Candidate ranking and applicant pipeline |
| 12 | `/candidate/recommendations` | Job recommendations |
| 13 | `/candidate/profile` | Candidate profile |

---

## 9. How the matching works

```
PDF ──► pdf.js text layer ──► resume parser ──► candidate skills
                                                   │
job description ──► skill extraction ──► required skills
                                                   │
        ┌──────────────────────────────────────────┴─────────────────────┐
        │ skill coverage = matched required skills / total required      │
        │ text similarity = cosine(TF-IDF(job), TF-IDF(resume))          │
        │ final score = 0.65 × skill coverage + 0.35 × text similarity   │
        └────────────────────────────────────────────────────────────────┘
```

1. **Preprocessing** — lowercase, strip punctuation (keeping `+`, `#`, `.` so `c++`, `c#` and `node.js` survive), remove stopwords, keep unigrams and bigrams.
2. **Skill extraction** — ~110 canonical skills with aliases (`react`, `reactjs`, `react.js` → `React.js`), matched with word boundaries so `java` never matches inside `javascript`; one-word fragments of a longer detected skill are pruned.
3. **Required skills** — recruiter-selected skills plus skills stated in the job description, skipping sentences marked as "plus / preferred / nice to have" and skipping soft skills.
4. **TF-IDF** — `idf(t) = ln((1 + N) / (1 + df(t))) + 1`, `w(t,d) = tf(t,d) × idf(t)`, computed over the job plus all resumes in the same request.
5. **Cosine similarity** — `cos(A,B) = (A·B) / (‖A‖‖B‖)`.
6. **Weighted score** — 65 % skill coverage, 35 % text similarity. If a job has no detectable required skills the engine falls back to text similarity only instead of inventing a number.
7. **Explanation** — e.g. `11 of 12 required skills matched (91.7%). TF-IDF cosine similarity 36.4% across 412 terms. Weighted: 0.65 × 91.7 + 0.35 × 36.4 = 72.3%.`

Verify without any UI or database:

```powershell
cd server
npm run check:nlp
```

---

## 10. Testing

### 10.1 NLP pipeline check (no database)

```powershell
cd server
npm run check:nlp
```

Prints, for every demo resume: parsed contact details, skills, education, certifications and experience years; then a full ranking table per job with matched and missing skills. Use it to confirm the algorithm itself.

### 10.2 API smoke test (database + running API)

```powershell
# terminal 1
cd server
npm run demo        # or: npm start (with local/Atlas MongoDB + npm run seed)

# terminal 2
cd server
npm run check:api
```

The script asserts 30 behaviours, including:

| Check | Expected |
|---|---|
| `GET /api/health` | 200 |
| Login candidate / recruiter / admin | 200 + JWT |
| `GET /api/admin/stats` without token | 401 |
| `GET /api/admin/stats` as candidate | 403 |
| `GET /api/matches/job/:id` as candidate | 403 |
| Job listing | 5 seeded jobs |
| Recommendations | scores between 0 and 100, matched + missing skills, explanation |
| Ranking | sorted descending, breakdown present, human-review note |
| Recruiter applicants + status update | 200, status changes to `shortlisted` |
| Registration of a new candidate | 201 |
| PDF upload | extracted skills and email persisted |
| Fake PDF (renamed text file) | 400 |
| Apply to a job | 201 with computed score |
| Duplicate application | 409 |

### 10.3 Manual test checklist

| # | Test | Steps | Expected result |
|---|---|---|---|
| 1 | Candidate registration | `/register/candidate` → submit unique email | Redirect to candidate dashboard, JWT stored |
| 2 | Duplicate email | Register again with the same email | 409 "account already exists" banner |
| 3 | Login validation | Wrong password | 401 "Invalid email or password" |
| 4 | Role protection | Log in as candidate, open `/admin/dashboard` | Redirected to candidate dashboard |
| 5 | Resume upload (valid) | Upload a text-based PDF ≤ 5 MB | Analysis card appears with skills and contact details |
| 6 | Upload non-PDF | Upload `.docx` or `.txt` | Rejected client-side and server-side |
| 7 | Upload oversized | Upload > 5 MB PDF | "Resume is too large" |
| 8 | Scanned PDF | Upload an image-only PDF | "No readable text found" - not silently accepted |
| 9 | Skill extraction | Open `/candidate/analysis` | Skills list, education lines, certifications, detected sections |
| 10 | Job creation | Recruiter → Job management → Post a job | Job visible in `/jobs` |
| 11 | Job edit | Change required skills, save | Match results cleared and recomputed on next ranking |
| 12 | Job delete | Delete a posting | Job and applications removed |
| 13 | Ranking | Recruiter → Candidate ranking → pick job | Ordered candidates with score, matched/missing skills, education, experience |
| 14 | Explainability | Open a candidate's detail | Weighted formula and skill counts shown |
| 15 | Recommendations | Candidate → Recommended jobs | Ranked jobs with gap analysis |
| 16 | Apply | Apply from recommendations | Score snapshot stored, duplicate blocked |
| 17 | Status workflow | Recruiter changes status to shortlisted | Candidate dashboard badge updates |
| 18 | Admin analytics | Admin login | Totals, score distribution, status pie, top skills, activity feed |

### 10.4 Sample test data

- **Resumes** — `server/utils/sampleData.js` (6 profiles rendered to PDF by the seed script; stored in `server/uploads/`)
- **Jobs** — the same file: MERN Stack Developer, Frontend Developer (React), Backend Developer (Node.js), Data Analyst, Full Stack Developer Intern
- **Copy-paste job for manual testing**

```
Title: Junior MERN Developer
Required skills: React.js, Node.js, Express.js, MongoDB, REST API, Git
Description: Build React.js interfaces and Express.js REST APIs backed by MongoDB.
Design Mongoose schemas, write JWT protected endpoints and collaborate in Git.
Minimum experience: 1 year
```

- **Edge cases to verify** — candidate with no resume applying (400), recruiter editing another recruiter's job (403), deactivated user logging in (403), resume downloaded by a different candidate (403).

---

## 11. API reference

Base URL: `http://localhost:5000/api` — all protected routes need `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Liveness check |
| POST | `/auth/register` | Public | Register candidate or recruiter |
| POST | `/auth/login` | Public | Login, returns JWT |
| GET | `/auth/me` | Any auth | Current user + profile + active resume |
| PUT | `/auth/profile` | Any auth | Update profile |
| PUT | `/auth/password` | Any auth | Change password |
| POST | `/resumes/upload` | Candidate | Upload PDF (`multipart/form-data`, field `resume`) |
| GET | `/resumes/me` | Candidate | Active resume + analysis |
| GET | `/resumes/:id` | Owner / recruiter / admin | Resume analysis by id |
| GET | `/resumes/:id/download` | Owner / recruiter / admin | Stream stored PDF |
| POST | `/resumes/:id/reanalyze` | Owner / admin | Re-run parsing on stored text |
| DELETE | `/resumes/:id` | Owner | Delete resume |
| GET | `/jobs` | Public | Search, filters, pagination (`q`, `location`, `workMode`, `employmentType`, `skill`, `maxExperience`, `page`, `limit`, `mine`) |
| GET | `/jobs/meta/skills` | Public | Most requested skills |
| GET | `/jobs/:id` | Public | Job detail + detected required skills |
| POST | `/jobs` | Recruiter / admin | Create job |
| PUT | `/jobs/:id` | Owner / admin | Update job |
| DELETE | `/jobs/:id` | Owner / admin | Delete job + applications + matches |
| GET | `/jobs/:id/applicants` | Owner / admin | Applicants with scores |
| GET | `/matches/job/:jobId` | Owner / admin | Ranked candidates + explanation |
| GET | `/matches/job/:jobId/statistics` | Owner / admin | Score distribution |
| GET | `/matches/recommendations` | Candidate | Scored open jobs |
| GET | `/matches/candidate/:candidateId` | Recruiter / admin | Candidate's stored matches |
| POST | `/applications/:jobId` | Candidate | Apply with active resume |
| GET | `/applications/me` | Candidate | My applications |
| PATCH | `/applications/:id/status` | Recruiter / admin | Update pipeline status |
| DELETE | `/applications/:id` | Candidate | Withdraw application |
| GET | `/applications/recruiter/summary` | Recruiter / admin | Pipeline counters |
| GET | `/admin/stats` | Admin | Dashboard analytics |
| GET | `/admin/users` | Admin | List users (`role`, `q`) |
| PATCH | `/admin/users/:id/status` | Admin | Activate / deactivate a user |

Errors always return JSON: `{ success: false, message, errors? }` with 400 / 401 / 403 / 404 / 409 / 422 / 500.

---

## 12. Security notes

- Passwords hashed with **bcrypt** (10 salt rounds); `password` is `select: false` and never serialised.
- **JWT** with expiry; role checks enforced server-side on every protected route (never trusted from the client).
- **PDF validation** on three levels: multer MIME + extension filter, `%PDF-` magic-byte check, and text-layer requirement.
- Uploads live outside the static web root and are streamed only through an authorized download endpoint.
- **Input validation** with express-validator; Mongoose schema validation with enums and length limits.
- **Rate limiting** (60 requests / 15 min) on `/api/auth/*`; helmet security headers; CORS restricted to `CLIENT_URL`.
- Query inputs escaped before regex use to avoid regex injection.
- Candidates can only read/delete their own resume; recruiters can only manage their own jobs and applications.
- Scores never auto-reject: the API returns a `note` and the UI repeats the human-review requirement.

---

## 13. Troubleshooting

| Symptom | Fix |
|---|---|
| `MongoDB connection failed` | MongoDB service not running, or wrong `MONGO_URI`. Start `mongod`, or use Atlas, or `npm run demo`. |
| Frontend shows "Cannot reach the API" | Backend is not on port 5000, or `VITE_API_URL` is wrong. Start `npm run dev` in `server`. |
| CORS error | `CLIENT_URL` in `server/.env` must match the browser origin exactly (e.g. `http://127.0.0.1:5173` vs `http://localhost:5173`). |
| `EADDRINUSE` | Port 5000 is taken: change `PORT` in `server/.env` and `VITE_API_URL` in `client/.env`. |
| "No readable text found" | The PDF is a scan. Export a text-based PDF from Word/Google Docs. |
| `npm run seed` deletes my data | Seed clears the collections it seeds by design. Never run it against a database you care about. |
| PowerShell blocks `npm.ps1` | `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal. |
| Scores all look low | All jobs require many skills; open a candidate's detail to see matched vs missing. Use `npm run check:nlp` to inspect the raw numbers. |

---

## 14. Documentation

- [`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md) — full 24-chapter mini-project report (abstract, problem statement, architecture, DFD, use case, ER diagram, database design, module description, algorithm, implementation, testing, results, limitations, future scope, references).

No project member names or registration numbers appear anywhere in the code, UI or documentation.

---

## 15. Deploying to Render (single service)

The repository ships a [`render.yaml`](render.yaml) blueprint. One Render web service installs both packages, builds the React client into `client/dist`, and starts Express — the API serves the built UI, so the app runs on **one URL with no CORS setup**. The client talks to `/api` by default, which is same-origin.

### Steps

1. Push this repository to GitHub (already done for this project).
2. In Render: **New +** → **Blueprint** → select the repo → **Apply**.
3. Render prompts for the two secrets marked `sync: false`:
   - `MONGO_URI` — your MongoDB Atlas connection string (`mongodb+srv://…`). The Atlas project must allow connections from Render; either add `0.0.0.0/0` under **Network Access** or the Render region's egress IPs.
   - `ADMIN_PASSWORD` — the administrator password (`swavi@gmail.com` is already set as `ADMIN_EMAIL`).
4. Wait for the first build, then open the service URL.

`JWT_SECRET` is generated by Render. `NODE_ENV=production` disables loopback-origin CORS and stack traces.

### Administrator account on a deployment

`npm run seed` is a local step and never runs on Render, so the server creates the administrator itself on every boot from `ADMIN_EMAIL` + `ADMIN_PASSWORD` (`server/services/adminBootstrap.js`). That means `swavi@gmail.com` works on the deployed URL exactly as it does on localhost, even when the deployed database is empty. It only creates a missing account (or restores `admin` role / active status on an existing one) — a password changed inside the app is kept, and a password changed in the dashboard must also be updated in Render's environment variables.

### What is stored where

- **MongoDB Atlas** — users, candidates, recruiters, jobs, matches, applications, resume text, parsed analysis, extracted photo, **and the uploaded PDF itself** (`Resume.fileData`). Render's filesystem is ephemeral, so the PDF copy in Mongo is what keeps “Resume PDF” downloads working after a restart or redeploy.
- **Render** — code and build output only. `server/uploads/` is used for the temporary file during upload.

### Render free-plan notes

- The service sleeps after 15 minutes of inactivity; the first request afterwards takes ~30–60 s.
- The free plan has no persistent disk — which is why PDFs live in MongoDB.
- Keep `MONGO_URI` and `ADMIN_PASSWORD` in Render's environment settings, never in the repo.

### Deploying the two services separately (alternative)

If you prefer Render's static-site + web-service split: build command `npm install && npm run build` with root directory `client`, publish directory `dist`; and a Node web service with root directory `server`, build `npm install`, start `npm start`. Then set `CLIENT_URL` on the API service to the static site URL and `VITE_API_URL` (build-time env var on the static site) to `https://<api-service>.onrender.com/api`.
