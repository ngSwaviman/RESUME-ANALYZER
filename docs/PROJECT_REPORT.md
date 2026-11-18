# AI Resume Screening & Job Matching System

### A Mini Project Report

**Department of Computer Science and Engineering**
**Nalanda Institute of Technology, Bhubaneswar**

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Abstract](#2-abstract)
3. [Problem Statement](#3-problem-statement)
4. [Objectives](#4-objectives)
5. [Existing System](#5-existing-system)
6. [Proposed System](#6-proposed-system)
7. [System Requirements](#7-system-requirements)
8. [Software and Hardware Requirements](#8-software-and-hardware-requirements)
9. [Technology Used](#9-technology-used)
10. [System Architecture](#10-system-architecture)
11. [Data Flow Diagram](#11-data-flow-diagram)
12. [Use Case Diagram](#12-use-case-diagram)
13. [ER Diagram](#13-er-diagram)
14. [Database Design](#14-database-design)
15. [Module Description](#15-module-description)
16. [Algorithm Explanation](#16-algorithm-explanation)
17. [Implementation](#17-implementation)
18. [Testing](#18-testing)
19. [Results](#19-results)
20. [Advantages](#20-advantages)
21. [Limitations](#21-limitations)
22. [Future Scope](#22-future-scope)
23. [Conclusion](#23-conclusion)
24. [References](#24-references)

---

## 1. Introduction

Recruitment at entry level is a volume problem. A single graduate opening routinely receives hundreds of resumes, and a recruiter has to compare each document against the same list of required skills. The work is repetitive, the criteria are subjective, and good candidates are frequently missed simply because their resume was not read carefully.

The **AI Resume Screening & Job Matching System** is a full-stack web application that automates the mechanical part of that process while keeping the decision with a human. Candidates upload a PDF resume; the server extracts the text, identifies contact details, skills, education, experience and certifications, and stores the result. Recruiters publish vacancies with required and preferred skills. A matching engine then compares every resume with every job description using **TF-IDF vectorisation** and **cosine similarity**, combined with explicit skill-overlap analysis, and produces a percentage score with a written explanation of how it was calculated.

The application is built on the MERN stack — MongoDB, Express.js, React.js and Node.js — with all NLP and matching logic implemented in JavaScript on the server. No external AI service, API key or Python runtime is required.

---

## 2. Abstract

This project presents a recruitment platform that screens resumes automatically and matches candidates to job openings. Candidates register, upload a text-based PDF resume, and receive an automatically generated profile containing their extracted skills, education, experience and certifications. Recruiters register, publish job vacancies with structured requirements, and view candidates ranked by a computed relevance score.

The matching engine works in four stages: text preprocessing (normalisation, tokenisation, stopword removal, bigram generation), skill extraction against a curated dictionary of technical and professional skills, TF-IDF vectorisation of the resume and job description, and cosine similarity between the resulting vectors. The final score is a weighted combination of skill coverage (65 %) and document similarity (35 %). Every score is persisted with the list of matched skills, missing skills and the arithmetic used to produce it, so a recruiter can see *why* a candidate ranked where they did.

The system includes role-based dashboards for candidates, recruiters and an administrator, an application workflow, and interactive charts for score distribution, application pipeline and skill demand. Security is handled with bcrypt password hashing, JSONwebtoken sessions, per-route role authorisation, PDF validation and private file storage. The platform is explicitly designed as decision support: it never rejects a candidate automatically.

**Keywords:** resume screening, TF-IDF, cosine similarity, skill extraction, MERN stack, recruitment, NLP.

---

## 3. Problem Statement

Manual resume screening creates four concrete problems:

1. **Volume** — a recruiter cannot carefully read hundreds of resumes for one opening, so screening degenerates into keyword scanning of the first page.
2. **Inconsistency** — two recruiters reading the same resume against the same job description often reach different conclusions, because no explicit criteria are recorded.
3. **Lost candidates** — a strong applicant whose resume uses different terminology ("ReactJS" instead of "React") can be filtered out by a naive keyword search.
4. **No audit trail** — when a candidate is rejected, there is usually no record of which requirement they failed, which makes feedback impossible and invites bias.

Existing job portals solve *discovery* (posting and finding jobs) but not *comparison*. They provide filters and keyword search, not a measured, explainable similarity between a specific resume and a specific job description.

The problem addressed by this project is therefore: **how to compare a candidate's resume with a job's requirements automatically, consistently and transparently, using only the information contained in the documents, while keeping the final decision with a human recruiter.**

---

## 4. Objectives

1. Provide secure role-based registration and login for candidates, recruiters and an administrator using bcrypt and JWT.
2. Accept PDF resumes with strict type, size and content validation, and store them privately.
3. Extract candidate information — name, email, phone, education, experience, certifications and skills — from the PDF text layer automatically.
4. Allow recruiters to create, edit, close and delete job vacancies with structured requirements.
5. Compute a real matching percentage between any resume and any job description using TF-IDF and cosine similarity, without hardcoded values.
6. Rank candidates per job from highest to lowest score, showing matched skills, missing skills, education and experience.
7. Recommend suitable jobs to candidates with an explanation of the gaps to close.
8. Provide dashboards with live statistics and interactive charts for recruiters and the administrator.
9. Keep the process auditable and human-controlled: explain every score and never auto-reject.

---

## 5. Existing System

| Aspect | Typical existing system | Limitation |
|---|---|---|
| Screening | Manual reading, or keyword filters in a job portal | No measurement, no consistency, no explanation |
| Matching | Exact keyword search (`"React"` only) | Misses synonyms and aliases; matches inside unrelated words |
| Ranking | None, or paid black-box AI screening | Recruiters cannot justify the ranking to a candidate or an auditor |
| Candidate experience | Application disappears into a void | No feedback on which requirement was missing |
| Data storage | Files in shared drives or email | No validation, no access control, privacy risk |
| Reporting | Spreadsheet counts maintained by hand | Stale, error-prone, no skill-demand insight |

A second class of existing systems is commercial AI screening, which usually relies on large proprietary models. These produce a number with no explanation, cannot be inspected for bias, and are unsuitable for a college project in terms of cost and transparency.

---

## 6. Proposed System

The proposed system is a three-tier web application with a transparent, reproducible matching engine.

**Key differences from the existing system**

- **Measured similarity instead of keywords.** Skills are canonicalised through a dictionary with aliases, and the full documents are compared with TF-IDF vectors.
- **Explainable score.** Each result stores `skillScore`, `textScore`, the weights, the matched and missing skills and a human-readable sentence describing the arithmetic.
- **Two-sided workflow.** Candidates get recommendations and gap analysis; recruiters get ranked applicants and a pipeline; the administrator gets platform analytics.
- **Human decision preserved.** The API and UI both state that scores are decision support only, and no endpoint changes a candidate's status automatically.
- **Self-contained stack.** All matching is implemented in JavaScript on the existing Node server, so there is no second runtime, no API key and no per-request cost.

---

## 7. System Requirements

### 7.1 Functional requirements

| ID | Requirement |
|---|---|
| FR-1 | The system shall allow candidates and recruiters to register with a unique email and hashed password. |
| FR-2 | The system shall authenticate users with JWT and authorise each request by role. |
| FR-3 | The system shall accept PDF resumes up to 5 MB, reject other formats and reject files without a readable text layer. |
| FR-4 | The system shall extract name, email, phone, skills, education, experience and certifications from an uploaded resume. |
| FR-5 | Recruiters shall create, edit, close and delete their own job vacancies. |
| FR-6 | The system shall compute a match percentage between a resume and a job description using skill overlap and TF-IDF cosine similarity. |
| FR-7 | The system shall rank candidates for a job from highest to lowest score with matched and missing skills. |
| FR-8 | The system shall recommend open jobs to a candidate ranked against their resume. |
| FR-9 | Candidates shall apply to open jobs; duplicate applications shall be blocked. |
| FR-10 | Recruiters shall review applicants and update application status. |
| FR-11 | The administrator dashboard shall show totals, top candidates, score distribution, application status split, top skills and recent activity. |
| FR-12 | Every score shall include an explanation and a human-review notice. |

### 7.2 Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | Response time under 2 seconds for ranking up to 100 resumes. |
| NFR-2 | Responsive UI usable from 360 px mobile to desktop. |
| NFR-3 | Passwords never stored or returned in plain text. |
| NFR-4 | Uploaded files never publicly accessible. |
| NFR-5 | Consistent JSON error format across all endpoints. |
| NFR-6 | Matching results reproducible for identical inputs. |
| NFR-7 | Modular structure: routes → controllers → services → models. |

---

## 8. Software and Hardware Requirements

### 8.1 Software

| Component | Requirement |
|---|---|
| Operating system | Windows 10/11, Ubuntu 20.04+ or macOS 12+ |
| Runtime | Node.js 18 LTS or newer (developed on Node.js 22) |
| Package manager | npm 9+ |
| Database | MongoDB Community Server 6+ locally, or MongoDB Atlas (free tier) |
| Editor | Visual Studio Code (recommended) |
| API testing | Postman, Thunder Client, or the included `npm run check:api` script |
| Browser | Chrome, Edge or Firefox (latest) |

### 8.2 Hardware (minimum)

| Component | Minimum | Recommended |
|---|---|---|
| Processor | Dual-core 2 GHz | Quad-core 2.5 GHz |
| RAM | 4 GB | 8 GB |
| Storage | 2 GB free | 5 GB free |
| Display | 1366 × 768 | 1920 × 1080 |
| Network | Required only for Atlas / npm installs | Broadband |

---

## 9. Technology Used

| Layer | Technology | Why it was chosen |
|---|---|---|
| Frontend | React 18 + Vite | Component model for 13 screens, fast HMR, small build config |
| Styling | Tailwind CSS 3 | Consistent design tokens, responsive utilities, no CSS file sprawl |
| Routing | React Router DOM 6 | Nested routes and role-guarded layouts |
| HTTP | Axios | Interceptors attach JWT and handle 401 globally |
| Charts | Recharts | Declarative SVG charts that fit the dashboard cards |
| Icons | lucide-react | Lightweight, consistent icon set |
| Backend | Node.js + Express 4 | Same language as frontend, minimal REST boilerplate |
| ODM | Mongoose 8 | Schema validation, population, aggregation pipeline |
| Database | MongoDB | Flexible documents for resumes with variable structure |
| Auth | bcryptjs + jsonwebtoken | Salted hashing and stateless sessions |
| Upload | multer | Multipart handling, disk storage, size limits |
| PDF text | pdfjs-dist (pdf.js) | Reliable text-layer extraction in Node; also gives glyph positions used to rebuild lines |
| Validation | express-validator | Declarative request validation with field-level errors |
| Security | helmet, express-rate-limit, cors | Headers, brute-force protection, origin allow-list |
| Matching | Custom JavaScript | TF-IDF and cosine similarity implemented and documented in-project |

**Why no Python microservice?** The matching workload is a handful of short documents per request; a JavaScript implementation runs in milliseconds and avoids a second deployment, a second dependency tree and an HTTP hop. The algorithms are identical to their Python equivalents, and every step is unit-inspectable in `server/services/tfidf.js`.

---

## 10. System Architecture

The application follows a three-tier architecture.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION TIER (React)                        │
│  Vite dev server / static build · React Router · Tailwind · Recharts      │
│                                                                           │
│  Landing · Login · Register · Candidate Dashboard · Recruiter Dashboard   │
│  Admin Dashboard · Upload · Analysis · Jobs · Job Management · Ranking    │
│  Recommendations · Profile · 404                                          │
│                                                                           │
│  AuthContext (JWT in localStorage) · Axios instance with interceptors     │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │  HTTPS / JSON  (Authorization: Bearer …)
┌───────────────────────────────▼───────────────────────────────────────────┐
│                        APPLICATION TIER (Node + Express)                  │
│                                                                           │
│  helmet · cors · rate-limit · morgan · express.json                       │
│                                                                           │
│  routes/ ──► middleware/auth ──► middleware/role ──► controllers/          │
│      │                                              │                     │
│      │                                              ▼                     │
│      │                                   services/ (pure logic)           │
│      │                                    ├─ pdfService   (pdf.js)        │
│      │                                    ├─ resumeParser (regex/NLP)     │
│      │                                    ├─ skillExtractor (dictionary)  │
│      │                                    ├─ textProcessing (tokens)      │
│      │                                    ├─ tfidf        (IDF + cosine)  │
│      │                                    └─ matchingService (weighting)  │
│      │                                              │                     │
│      │                                              ▼                     │
│      └──────────────────────────────► models/ (Mongoose schemas)          │
│  multer disk storage ──► server/uploads (private, streamed on demand)     │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │  Mongoose driver
┌───────────────────────────────▼───────────────────────────────────────────┐
│                              DATA TIER (MongoDB)                          │
│  users · candidates · recruiters · resumes · jobs · applications ·        │
│  matchresults                                                             │
└───────────────────────────────────────────────────────────────────────────┘
```

**Request lifecycle (resume upload example)**

1. React posts `multipart/form-data` to `/api/resumes/upload` with the JWT header.
2. `protect` verifies the token and loads the user; `authorize('candidate')` checks the role.
3. `uploadResume` (multer) validates MIME type, extension and size, then writes the file to `server/uploads/` with a random name.
4. The controller reads the buffer, checks the `%PDF-` signature, extracts the text with pdf.js and runs the parser.
5. The parsed result is stored in `resumes.analysis`, and the candidate profile is enriched with the extracted skills, education and experience.
6. The response returns the analysis; the React page renders the extracted fields immediately.

---

## 11. Data Flow Diagram

### 11.1 Level 0 — Context diagram

```
        ┌───────────┐   register / login / upload PDF   ┌──────────────────────────┐
        │ Candidate │ ────────────────────────────────► │                          │
        │           │ ◄──────────────────────────────── │  AI Resume Screening &   │
        └───────────┘   analysis, matches, job list     │  Job Matching System     │
                                                        │                          │
        ┌───────────┐   login / post job / review       │                          │
        │ Recruiter │ ────────────────────────────────► │                          │
        │           │ ◄──────────────────────────────── │                          │
        └───────────┘   ranked candidates, applicants   │                          │
                                                        │                          │
        ┌───────────┐   login / monitor platform        │                          │
        │   Admin   │ ◄───────────────────────────────► │                          │
        └───────────┘   statistics, activity feed       └──────────────────────────┘
```

### 11.2 Level 1 — Major processes

```
Candidate ──► [1.0 Authenticate] ──► D1 users ──► D2 candidates / D3 recruiters
                   ▲                       │
Recruiter ─────────┘                       │ JWT
                                           ▼
Candidate ──PDF──► [2.0 Upload & Extract] ──► D4 resumes
                        │  pdf.js text
                        │  parser + skill dictionary
                        ▼
                   [3.0 Analyse Resume] ──► D2 candidates (skills, education, experience)
                        │
Recruiter ──form──► [4.0 Manage Jobs] ──► D5 jobs
                        │
                        ▼
                   [5.0 Match & Rank] ◄── D4 resumes, D5 jobs
                        │  TF-IDF + cosine + skill overlap
                        ▼
                   D7 matchresults ──► Recruiter (ranking) / Candidate (recommendations)
                        │
Candidate ────────► [6.0 Apply] ──► D6 applications ──► Recruiter (status review)
                        │
Admin ────────────► [7.0 Dashboard] ◄── D1..D7 aggregates
```

**Data stores**

| Store | Collection |
|---|---|
| D1 | `users` |
| D2 | `candidates` |
| D3 | `recruiters` |
| D4 | `resumes` |
| D5 | `jobs` |
| D6 | `applications` |
| D7 | `matchresults` |

---

## 12. Use Case Diagram

```
                                  ┌───────────────────────────────────────────┐
                                  │      AI Resume Screening & Matching       │
                                  │                                           │
  ┌───────────┐                   │  ( Register / Login )                     │
  │ Candidate │───────────────────┼─►( Upload PDF resume )                   │
  └───────────┘                   │  ( View resume analysis )                 │
        │                         │  ( Browse & filter jobs )                 │
        │                         │  ( View job recommendations )             │
        ├─────────────────────────┼─►( Apply to job )                        │
        │                         │  ( Track applications )                   │
        │                         │  ( Maintain profile )                     │
        │                         │                                           │
  ┌───────────┐                   │  ( Create / edit / delete job )           │
  │ Recruiter │───────────────────┼─►( View ranked candidates )              │
  └───────────┘                   │  ( View applicants )                      │
        │                         │  ( Shortlist / reject application )       │
        ├─────────────────────────┼─►( View pipeline dashboard )             │
        │                         │                                           │
  ┌───────────┐                   │  ( View platform statistics )             │
  │   Admin   │───────────────────┼─►( View top candidates & activity )      │
  └───────────┘                   │  ( Activate / deactivate users )          │
                                  └───────────────────────────────────────────┘
```

**Actor–use-case summary**

| Actor | Use cases |
|---|---|
| Candidate | Register, login, upload resume, view analysis, browse jobs, view recommendations, apply, track applications, edit profile |
| Recruiter | Register, login, create/edit/delete job, view ranking, view applicants, update application status, view pipeline |
| Admin | Login, view platform statistics, view top candidates, view activity, activate/deactivate users |
| System (automated) | Extract PDF text, parse resume, extract skills, compute TF-IDF, compute cosine similarity, persist match results |

---

## 13. ER Diagram

```
┌──────────────┐           1       1 ┌───────────────┐
│    users     │─────────────────────│  candidates   │
│──────────────│                     │───────────────│
│ _id (PK)     │                     │ _id (PK)      │
│ name         │                     │ user (FK)     │
│ email (UQ)   │                     │ headline      │
│ password     │                     │ skills[]      │
│ role         │                     │ education[]   │
│ phone        │                     │ experience[]  │
│ isActive     │                     │ resume (FK)─┐ │
└──────┬───────┘                     └──────┬──────┘│
       │ 1                                  │ 1     │
       │                                    │       │
       │ 0..1                         1     ▼       │
       │                        ┌──────────────────┐│
       ├────────────────────────│    resumes       ││
       │                        │──────────────────││
       │                        │ _id (PK)         ││
       │                        │ candidate (FK)   ││
       │                        │ user (FK)        ││
       │                        │ text             ││
       │                        │ analysis{}       ││
       │                        │ isActive         ││
       │                        └────────┬─────────┘│
       │                                 │ 1        │
       │                        ┌────────▼─────────┐│
       │                        │  applications    ││
       │                        │──────────────────││
       │                        │ job (FK)         ││
       │                        │ candidate (FK)   ││
       │                        │ matchScore       ││
       │                        │ status           ││
       │                        └────────▲─────────┘│
       │                                 │ 1        │
       │ 1                               │          │
┌──────▼───────┐   1       1..*  ┌──────┴───────┐   │
│  recruiters  │─────────────────│    jobs      │   │
│──────────────│                 │──────────────│   │
│ _id (PK)     │                 │ _id (PK)     │   │
│ user (FK)    │                 │ recruiter(FK)│   │
│ company      │                 │ createdBy(FK)│   │
│ designation  │                 │ title        │   │
└──────────────┘                 │ requiredSkills[] │
                                 │ minExperience│   │
                                 │ status       │   │
                                 └──────┬───────┘   │
                                        │ 1         │
                                        ▼           │
                                 ┌──────────────────┴──┐
                                 │    matchresults     │
                                 │─────────────────────│
                                 │ job (FK)            │
                                 │ candidate (FK)      │
                                 │ score / skillScore  │
                                 │ matchedSkills[]     │
                                 │ missingSkills[]     │
                                 │ breakdown{}         │
                                 └─────────────────────┘
```

**Relationships**

| Relationship | Cardinality | Notes |
|---|---|---|
| User → Candidate | 1 : 1 | One profile per candidate account |
| User → Recruiter | 1 : 1 | One company profile per recruiter account |
| Candidate → Resume | 1 : N | Upload history; exactly one `isActive` resume |
| Recruiter → Job | 1 : N | Recruiter owns their postings |
| Candidate → Application | 1 : N | Unique per (job, candidate) |
| Job → Application | 1 : N | Cascade delete with the job |
| Job + Candidate → MatchResult | 1 : 1 | Unique per pair, upserted on recompute |

---

## 14. Database Design

Database name: `resume_analyzer`.

### 14.1 `users`

| Field | Type | Constraints |
|---|---|---|
| `_id` | ObjectId | PK |
| `name` | String | required, max 80 |
| `email` | String | required, unique, lowercase, regex |
| `password` | String | required, min 6, bcrypt hash, `select:false` |
| `role` | String | enum `candidate` / `recruiter` / `admin` |
| `phone` | String | optional |
| `isActive` | Boolean | default true |
| `lastLoginAt` | Date | updated on login |
| `createdAt`, `updatedAt` | Date | timestamps |

Indexes: unique `email`; role used in counts.

### 14.2 `candidates`

| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → users | unique, required |
| `headline`, `summary`, `location` | String | profile text |
| `skills` | [String] | canonical skill names |
| `education` | [{degree, institution, field, startYear, endYear, score}] | embedded documents |
| `experience` | [{title, company, location, startDate, endDate, current, description}] | embedded |
| `certifications` | [String] | |
| `experienceYears` | Number | derived by the parser |
| `links` | {linkedin, github, portfolio} | |
| `resume` | ObjectId → resumes | active resume |
| `profileCompletion` | Number | 0–100 |

Index: `skills` (multikey) for analytics.

### 14.3 `recruiters`

`user` (unique), `company` (required), `designation`, `website`, `location`, `industry`, `about`, `companySize`.

### 14.4 `resumes`

| Field | Type | Notes |
|---|---|---|
| `candidate`, `user` | ObjectId | required |
| `originalName`, `storedName`, `filePath` | String | stored name is randomised |
| `mimeType`, `size` | String, Number | validated |
| `text` | String | extracted PDF text |
| `analysis` | {name, email, phone, skills[], education[], experience[], certifications[], experienceYears, wordCount, sectionsDetected{}} | parser output |
| `isActive` | Boolean | one active resume per candidate |

Index: `candidate`, `uploadedAt` (descending for history).

### 14.5 `jobs`

| Field | Type | Notes |
|---|---|---|
| `recruiter`, `createdBy` | ObjectId | ownership |
| `title`, `company`, `location` | String | |
| `workMode` | enum | onsite / remote / hybrid |
| `employmentType` | enum | full-time / part-time / internship / contract |
| `description` | String | min 40 chars (needed for matching) |
| `responsibilities` | [String] | |
| `requiredSkills` | [String] | non-empty; drives the score |
| `preferredSkills` | [String] | displayed, not scored |
| `education`, `minExperience` | String, Number | requirements |
| `salary` | {min, max, currency} | |
| `openings`, `status` | Number, enum | open / closed |

Indexes: `recruiter`, `status`, text index on title/description/skills.

### 14.6 `applications`

| Field | Type | Notes |
|---|---|---|
| `job`, `candidate`, `recruiter`, `resume` | ObjectId | references |
| `status` | enum | applied / shortlisted / on-hold / rejected |
| `coverLetter` | String | max 3000 |
| `matchScore` | Number | snapshot at apply time |
| `matchedSkills`, `missingSkills` | [String] | snapshot |
| `recruiterNote`, `reviewedAt` | String, Date | |

Index: unique compound `(job, candidate)` — prevents duplicate applications at the database level.

### 14.7 `matchresults`

| Field | Type | Notes |
|---|---|---|
| `job`, `candidate`, `resume` | ObjectId | |
| `score` | Number | 0–100, weighted final |
| `skillScore`, `textScore` | Number | components |
| `matchedSkills`, `missingSkills`, `requiredSkills` | [String] | explainability |
| `breakdown` | {requiredFound, requiredTotal, cosineSimilarity, termCount, weights{}} | |
| `explanation` | String | human-readable arithmetic |
| `computedAt` | Date | |

Indexes: unique `(job, candidate)`, `(job, score desc)` for ranking queries.

### 14.8 Sample document (abridged)

```json
{
  "_id": "65f1c...",
  "job": "65f1b...",
  "candidate": "65f1a...",
  "score": 77.7,
  "skillScore": 100,
  "textScore": 36.4,
  "matchedSkills": ["React.js", "Node.js", "Express.js", "MongoDB", "JavaScript",
                    "REST API", "Git", "JWT", "Mongoose", "CSS3", "HTML5", "Responsive Design"],
  "missingSkills": [],
  "explanation": "12 of 12 required skills matched (100.0%). TF-IDF cosine similarity 36.4% across 402 terms. Weighted: 0.65 × 100.0 + 0.35 × 36.4 = 77.7%."
}
```

---

## 15. Module Description

### Module 1 — Authentication

Candidates and recruiters register through separate screens; the role is validated server-side so an admin account cannot be created through the public endpoint. Passwords are hashed by a Mongoose `pre-save` hook using bcrypt with 10 salt rounds and are never selected by default. Login issues a JWT containing the user id and role with a configurable expiry. `protect` validates the token on every protected route, reloads the user (so deactivation takes effect immediately) and `authorize(...roles)` enforces role-based access control.

### Module 2 — Resume Upload

Multer accepts a single `resume` field, restricts MIME type and extension to PDF, and enforces a 5 MB limit. The controller additionally verifies the `%PDF-` signature and requires a non-empty text layer, so a renamed image cannot enter the system. Files are stored under randomised names in `server/uploads/` and streamed only through an authorised download endpoint. Previous uploads remain as history while exactly one resume is marked active.

### Module 3 — Resume Analysis

`pdfService` extracts text with pdf.js and rebuilds lines by grouping glyphs on the same baseline — important because the parser works line by line. `resumeParser` detects section headings (summary, skills, experience, education, certifications, projects) and applies targeted patterns for email, phone, name, degrees, institutions, roles and certifications, and derives experience years from either an explicit statement ("2 years of experience") or by summing intervals in the work-history date ranges. `skillExtractor` matches the curated dictionary and also parses the explicit skills list, expanding glued tokens and pruning fragments.

### Module 4 — Job Management

Recruiters create jobs with title, description, required and preferred skills, experience, education, salary, openings and status. Skills are canonicalised on write (`reactjs` → `React.js`) so matching is consistent. Ownership is checked on every update and delete; a recruiter cannot touch another company's posting, while the admin can. Deleting a job cascades to its applications and match results. Editing a job's requirements invalidates stored scores, which are deleted and recomputed on the next ranking request.

### Module 5 — AI Resume Matching

This module contains the algorithm described in Section 16. For a given job it loads every active resume, extracts required skills from the recruiter's list plus skills stated in the job description (ignoring sentences that mark a technology as optional), builds one TF-IDF space across the job and all resumes, and computes for each candidate the skill coverage and cosine similarity. The weighted score, components, matched/missing skills and explanation are upserted into `matchresults` and returned sorted descending.

### Module 6 — Job Recommendation

The candidate's active resume is scored against every open job, each result carrying matched skills, missing skills and the same explanation text. Results are sorted and limited, and the response includes the candidate's extracted skills for context.

### Module 7 — Admin Dashboard

Aggregation pipelines produce platform totals, the five best candidates by match score, score-distribution buckets, application status counts, the ten most common candidate skills, top recruiters by job count, and a merged activity feed from registrations, resumes, jobs and applications. The React dashboard renders these as stat cards, a bar chart, a donut chart, a horizontal bar chart and a timeline.

---

## 16. Algorithm Explanation

### 16.1 Step 1 — Text preprocessing

1. Lowercase and normalise Unicode (remove diacritics).
2. Remove punctuation **except** `+`, `#`, `.` and `-`, so `c++`, `c#` and `node.js` survive; `/` becomes a space so `ui/ux` and `ci/cd` compare correctly.
3. Split on whitespace, drop tokens of length 1, numeric-only tokens, and stopwords (English stopwords plus resume boilerplate such as *resume*, *education*, *experience*, *responsible*).
4. Add bigrams (`machine_learning`) so multi-word concepts keep their meaning.

### 16.2 Step 2 — Skill extraction

A dictionary of ~110 skills, each with a canonical name and aliases, is compiled into one regular expression with lookarounds:

```
(?<![a-z0-9+#])(?:react[\s\-_/]*js|reactjs|react|node[\s\-_/]*js|…)(?![a-z0-9+#])
```

The boundaries guarantee that `java` does not match inside `javascript` and `sql` does not match inside `mysql`. Matches are mapped back to canonical names and de-duplicated. Short fragments that are words of a longer detected skill (`Machine`, `Learning`, `UI`, `UX`) are pruned.

### 16.3 Step 3 — Required skills for a job

`required = canonical(recruiter.requiredSkills) ∪ skills(description)`

Skills are extracted from description sentences only (not from the responsibilities list), soft skills are excluded, and any sentence containing *plus / preferred / nice to have / bonus / familiarity with* is skipped so optional technologies do not penalise candidates.

### 16.4 Step 4 — TF-IDF

For a corpus of *N* documents (one job + *n* resumes):

```
tf(t,d)  = count(t,d) / |d|
idf(t)   = ln( (1 + N) / (1 + df(t)) ) + 1
w(t,d)   = tf(t,d) × idf(t)
```

The smoothed IDF avoids division by zero and prevents terms present in every document from dominating.

### 16.5 Step 5 — Cosine similarity

```
cos(A,B) = (A · B) / (‖A‖ · ‖B‖)
```

Cosine ignores document length, which matters because a resume is usually shorter than a job description. The implementation iterates over the smaller vector for the dot product and computes both norms in the same pass.

### 16.6 Step 6 — Weighted, explainable score

```
skillScore = matchedRequired / totalRequired × 100
textScore  = cosine(jobVector, resumeVector) × 100
score      = 0.65 × skillScore + 0.35 × textScore        (0–100, 1 decimal)
```

Skill coverage carries more weight because it is explicit, checkable evidence. If a job yields no required skills, the weights switch to 100 % text similarity rather than producing a misleading number.

**Worked example — Ananya Mohapatra vs "MERN Stack Developer"**

| Quantity | Value |
|---|---|
| Required skills | 12 |
| Matched skills | 12 → skillScore = 12/12 × 100 = **100.0 %** |
| Cosine similarity | **0.364** → textScore = **36.4 %** |
| Weighted score | 0.65 × 100.0 + 0.35 × 36.4 = **77.7 %** |

**Worked example — Rohan Das vs the same job**

15 of 12 required skills do not apply; he matches 6 of 12 (50.0 %) with cosine 0.129 (12.9 %):

`0.65 × 50.0 + 0.35 × 12.9 = 32.5 + 4.5 = 37.0 %`

This is the intended behaviour: a strong frontend profile scores moderately for a full-stack role and highly (75.1 %) for the React role.

### 16.7 Complexity

With *n* resumes and *m* average tokens: tokenising is *O(n·m)*, vocabulary build *O(n·m)*, vector construction *O(n·m)*, and each cosine *O(V)*. Ranking is therefore *O(n·m + n·V)* — linear in the number of resumes, which is why the API ranks a few hundred resumes in well under a second. Match results are persisted, so repeated views of a ranking page do not recompute unless the recruiter asks for a fresh ranking.

### 16.8 Design decisions and trade-offs

| Decision | Reason |
|---|---|
| Dictionary + TF-IDF instead of embeddings | Deterministic, explainable, no model download or API cost |
| Skill coverage weighted above text similarity | Explicit evidence should dominate stylistic similarity |
| Separate IDF space per ranking request | Scores are comparable within a job; prevents candidate leakage across jobs |
| Bigrams | Preserves "machine learning", "data analysis" |
| Soft skills excluded from auto-extraction | "Communication" is contextual; only a recruiter may require it |
| Preferred-sentence skipping | "Docker is a plus" must not read as "Docker required" |

---

## 17. Implementation

### 17.1 File responsibilities

| File | Responsibility |
|---|---|
| `server/server.js` | Express bootstrap, security middleware, CORS allow-list, route mounting, health check, error handlers |
| `server/config/db.js` | Mongoose connection with a 10 s selection timeout and clear error logging |
| `server/models/*.js` | Seven schemas with validation, indexes and the bcrypt pre-save hook |
| `server/middleware/auth.js` | `protect`, `optionalAuth`, `signToken` |
| `server/middleware/role.js` | `authorize(...roles)` |
| `server/middleware/upload.js` | Multer disk storage, PDF filter, size limit, file removal helper |
| `server/middleware/errorHandler.js` | Uniform JSON errors (Mongoose, duplicate key, multer, malformed JSON) |
| `server/services/tfidf.js` | IDF, TF-IDF vectors, cosine similarity |
| `server/services/matchingService.js` | Required-skill derivation, ranking, weighted score, explanation |
| `server/controllers/matching*.js` | Ranking, recommendations, statistics endpoints |
| `client/src/context/AuthContext.jsx` | Session persistence, login/register/logout, silent refresh |
| `client/src/services/api.js` | Axios instance, JWT interceptor, 401 handling, error messages |
| `client/src/components/*` | Layout, guards, stat cards, score bar, chips, modal, job card |
| `client/src/pages/*` | 13 application screens plus 404 |

### 17.2 Selected implementation details

**bcrypt hashing (model hook)**

```js
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});
```

**JWT verification middleware**

```js
const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
if (!token) throw ApiError.unauthorized('Not authenticated. Please log in.');
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const user = await User.findById(decoded.id);
if (!user) throw ApiError.unauthorized('Account no longer exists.');
req.user = user;
```

**TF-IDF and cosine (core of the engine)**

```js
const idf = Math.log((1 + totalDocuments) / (1 + df)) + 1;
const weight = (count / totalTokens) * idf;
// cosine
small.forEach((weight, token) => {
  const other = large.get(token);
  if (other) dot += weight * other;
});
return dot / (Math.sqrt(normA) * Math.sqrt(normB));
```

**Weighted score and explanation**

```js
const score = Math.round((0.65 * skillScore + 0.35 * textScore) * 10) / 10;
const explanation =
  `${matched.length} of ${required.length} required skills matched (${skillScore.toFixed(1)}%). ` +
  `TF-IDF cosine similarity ${(cosine * 100).toFixed(1)}% across ${vocabularySize} terms. ` +
  `Weighted: 0.65 × ${skillScore.toFixed(1)} + 0.35 × ${textScore.toFixed(1)} = ${score.toFixed(1)}%.`;
```

**Line reconstruction from the PDF text layer**

```js
const key = Math.round(y / 2.5) * 2.5;          // group glyphs on a baseline
const gap = item.x - (previous.x + previous.width);
const needsSpace = gap > 1 && !/\s$/.test(line) && !/^\s/.test(item.str);
line += needsSpace ? ` ${item.str}` : item.str;
```

**Application snapshot**

```js
const application = await Application.create({
  job, candidate, resume: candidate.resume._id,
  matchScore: analysis.score,
  matchedSkills: analysis.matchedSkills,
  missingSkills: analysis.missingSkills,
  status: 'applied',
});
```

The snapshot means a later edit to the job cannot silently rewrite history.

---

## 18. Testing

### 18.1 Test strategy

| Level | Method |
|---|---|
| Unit-level (algorithm) | `npm run check:nlp` — renders demo resumes to PDF, extracts text, parses, prints scores per job |
| Integration (API) | `npm run check:api` — 30 assertions against the running API |
| Validation and security | Part of the API script (401/403/400/409 paths) |
| Manual UI | Checklist below, executed against both roles |

### 18.2 Automated API results

Command (two terminals): `npm run demo` then `npm run check:api`.

```
PASS  health endpoint responds
PASS  candidate login
PASS  candidate profile loads with resume — Ananya_Mohapatra_Resume.pdf
PASS  unauthenticated admin request is blocked — status 401
PASS  candidate blocked from admin stats — status 403
PASS  job listing returns seeded jobs — 5 jobs
PASS  candidate blocked from ranking endpoint — status 403
PASS  recommendations computed for candidate — top score 79.3% for MERN Stack Developer
PASS  recommendation includes matched and missing skills — 12 matched / 0 missing
PASS  score explanation is returned
PASS  candidate applications load — 2 applications
PASS  recruiter login
PASS  recruiter sees own jobs — Full Stack Developer Intern
PASS  ranking returns scored candidates — Priya Nayak at 74.4%
PASS  ranking is sorted high to low
PASS  ranking carries explainable breakdown
PASS  ranking shows human-review note
PASS  recruiter can view applicants — 4 applicants
PASS  recruiter updates application status
PASS  admin login
PASS  admin dashboard statistics load — 6 candidates, avg match 36.9%
PASS  admin top candidates chart data present
PASS  admin activity feed present
PASS  candidate registration
PASS  PDF upload extracts text and skills — 20 skills, 169 words
PASS  extracted contact details persisted — ananya.mohapatra@example.com
PASS  invalid PDF rejected — This file is not a valid PDF.
PASS  application computed a match score — 76.1% for Full Stack Developer Intern
PASS  duplicate application blocked — status 409
PASS  new candidate appears in someone else's ranking

All API checks passed.
```

### 18.3 Test cases

| ID | Test | Input | Expected | Observed |
|---|---|---|---|---|
| TC-01 | Candidate registration | unique email, 8-char password | 201, JWT returned | Pass |
| TC-02 | Duplicate email | same email twice | 409 conflict | Pass |
| TC-03 | Login — wrong password | bad password | 401 | Pass |
| TC-04 | Role protection | candidate token → `/admin/stats` | 403 | Pass |
| TC-05 | Missing token | no header → `/admin/stats` | 401 | Pass |
| TC-06 | PDF upload | 1-page text PDF | 201, 20 skills, email extracted | Pass |
| TC-07 | Non-PDF rejected | `.txt` renamed to `.pdf` | 400 "not a valid PDF" | Pass |
| TC-08 | Oversized file | PDF > 5 MB | 400 size message | Pass |
| TC-09 | Scanned PDF | image-only PDF | 400 "no readable text" | Pass |
| TC-10 | Resume ownership | other candidate opens resume by id | 403 | Pass |
| TC-11 | Job creation | valid form | 201, visible in listing | Pass |
| TC-12 | Job validation | 10-character description | 422 field error | Pass |
| TC-13 | Job ownership | recruiter edits another's job | 403 | Pass |
| TC-14 | Ranking | job with 12 required skills | sorted list, scores 0–100 | Pass |
| TC-15 | Ranking explanation | open a candidate | weights and counts shown | Pass |
| TC-16 | Recommendations | candidate with resume | 5 scored jobs | Pass |
| TC-17 | Recommend without resume | new candidate | 400 with guidance | Pass |
| TC-18 | Apply | open job | 201 + score snapshot | Pass |
| TC-19 | Duplicate apply | same job twice | 409 | Pass |
| TC-20 | Status update | recruiter patch | 200, status changed | Pass |
| TC-21 | Candidate pipeline | `/applications/me` | own applications only | Pass |
| TC-22 | Admin analytics | admin token | totals, 5 buckets, activity | Pass |
| TC-23 | Job delete cascade | delete job with applicants | job, applications, matches removed | Pass |
| TC-24 | Recompute on edit | change required skills | stored matches cleared | Pass |

### 18.4 Manual UI checklist

| Screen | Check |
|---|---|
| Landing | Renders hero, feature grid, workflow, footer; no console errors |
| Login | Registered accounts sign in; invalid password shows inline error |
| Registration | Both forms validate and redirect to the correct dashboard |
| Candidate dashboard | Stat cards, applications table, recommendations, skill chips |
| Recruiter dashboard | Pipeline bar chart, recent applicants, job table with applicant counts |
| Admin dashboard | Six totals, score distribution chart, status donut, top skills, activity feed |
| Upload | Drag-and-drop, progress bar, rejection of invalid files, analysis card |
| Analysis | Contact details, skills, sections detected, education, experience, certifications, raw text |
| Job listing | Search, filters, pagination, apply modal |
| Job management | Create/edit modal, validation messages, delete confirmation |
| Ranking | Job selector, ranked table, detail modal, applicant status dropdown |
| Recommendations | Score, matched/missing skills, score breakdown, apply |
| Profile | Editable fields, education/experience rows, completion meter |

### 18.5 Test data

- Six demo resumes with different profiles (strong MERN, frontend, Java backend, data analyst, fresher, senior full-stack), rendered to real PDFs by `npm run seed`.
- Five job postings with different required skill sets.
- Nine seeded applications across the best-fitting roles.
- Edge cases: empty resume, scanned PDF, duplicate email, foreign job id, expired token.

---

## 19. Results

### 19.1 Resume parsing accuracy (demo set)

| Candidate | Pages | Words | Skills detected | Experience (derived) | Email | Phone | Education | Certifications |
|---|---|---|---|---|---|---|---|---|
| Ananya Mohapatra | 1 | 169 | 20 | 2 years | ✓ | ✓ | ✓ | 2 |
| Rohan Das | 1 | 133 | 14 | 1 year | ✓ | ✓ | ✓ | 1 |
| Sneha Patnaik | 1 | 151 | 16 | 3 years | ✓ | ✓ | ✓ | 1 |
| Arjun Behera | 1 | 144 | 14 | 1 year | ✓ | ✓ | ✓ | 2 |
| Priya Nayak | 1 | 126 | 14 | 0 years | ✓ | ✓ | ✓ | 1 |
| Karan Mishra | 1 | 167 | 25 | 4 years | ✓ | ✓ | ✓ | 2 |

All six resumes yielded contact details, at least one education line, and skills; the `sectionsDetected` flags were true for all six profiles.

### 19.2 MERN Stack Developer — ranking produced by the engine

| Rank | Candidate | Skill coverage | Text similarity | Match score | Missing skills |
|---|---|---|---|---|---|
| 1 | Ananya Mohapatra | 100.0 % (12/12) | 36.4 % | **77.7 %** | — |
| 2 | Karan Mishra | 91.7 % (11/12) | 18.0 % | **65.9 %** | Responsive Design |
| 3 | Priya Nayak | 83.3 % (10/12) | 33.5 % | **65.9 %** | JWT, Responsive Design |
| 4 | Rohan Das | 50.0 % (6/12) | 12.9 % | **37.0 %** | Node.js, Express.js, MongoDB, REST API, JWT, Mongoose |
| 5 | Sneha Patnaik | 25.0 % (3/12) | 6.6 % | **18.6 %** | 9 skills |
| 6 | Arjun Behera | 0.0 % | 0.5 % | **0.2 %** | 12 skills |

### 19.3 Cross-job matrix — each candidate's strongest role

| Candidate | MERN Developer | Frontend (React) | Backend (Node) | Data Analyst |
|---|---|---|---|---|
| Ananya Mohapatra | **77.7** | 61.2 | 73.4 | low |
| Rohan Das | 37.0 | **75.1** | 9.6 | very low |
| Sneha Patnaik | 18.6 | 8.4 | 28.0 | low |
| Arjun Behera | 0.2 | 0.1 | 0.6 | **78.5** |
| Karan Mishra | 65.9 | 51.6 | 61.6 | low |
| Priya Nayak | 65.9 | 44.1 | 55.4 | low |

The matrix confirms the engine discriminates correctly: each candidate peaks on the role that matches their skill set, rather than every candidate scoring highly on every job. Seeding produced 30 persisted match results and nine applications from this ranking.

### 19.4 Explainability sample

```
Ananya Mohapatra → MERN Stack Developer
12 of 12 required skills matched (100.0%). TF-IDF cosine similarity 36.4% across 402 terms.
Weighted: 0.65 × 100.0 + 0.35 × 36.4 = 77.7%.
```

### 19.5 Observations

1. **Skill coverage dominates sensibly.** Ananya and Priya have nearly identical skill coverage (100 % vs 83.3 %) but different text similarity (36.4 % vs 33.5 %), so their scores stay close — which matches a human reading of the two resumes.
2. **A senior candidate is not automatically first.** Karan (4 years) ranks second for the MERN role because his resume does not mention "Responsive Design", even though he matches 11 of 12. This is a limitation of document-based matching and is exactly why human review is required.
3. **Text similarity is naturally low (10–40 %).** Resumes and job descriptions use different vocabulary; low cosine values are expected and are the reason the weights favour explicit skills.
4. **Cross-domain candidates separate cleanly.** Arjun (data analyst) scores 0.2 % for the MERN role and 78.5 % for the Data Analyst role.
5. **Parsing failures are visible, not silent.** A scanned PDF is rejected with a clear message rather than producing a zero-skill profile.

---

## 20. Advantages

1. **Explainable by construction.** Every percentage is accompanied by the matched skills, missing skills and the arithmetic that produced it.
2. **No black box, no API cost.** TF-IDF and cosine similarity are deterministic and run locally in JavaScript.
3. **Consistent comparison.** The same resume-job pair always produces the same score.
4. **Gap analysis for candidates.** Missing skills turn a rejection into actionable feedback.
5. **Two-sided efficiency.** Recruiters get a ranked shortlist; candidates get ranked opportunities.
6. **Real document handling.** Genuine PDF text extraction, not filename or form-field matching.
7. **Security-aware design.** bcrypt, JWT, role checks, private uploads, file signature validation, rate limiting and input validation.
8. **Human control preserved.** The system recommends; it never rejects automatically.
9. **Analytics for administration.** Skill demand and score distribution reveal trends that a spreadsheet cannot.
10. **Maintainable architecture.** Routes → controllers → services → models, with pure functions that are easy to test.

---

## 21. Limitations

1. **Text-layer dependency.** Scanned or image-only PDFs cannot be parsed without OCR.
2. **Dictionary coverage.** Skills outside the ~110-entry dictionary are only captured if they appear in a clearly formatted skills list; new technologies require a dictionary entry.
3. **Lexical matching.** TF-IDF compares words, not meaning. "Built REST services" and "developed web APIs" share fewer terms than a human would expect, so related experience can be under-weighted.
4. **Formatting sensitivity.** Multi-column layouts and tables can scramble line order, affecting education and experience extraction.
5. **No experience weighting inside the text score.** Years of experience are compared as a separate eligibility flag, not folded into the percentage.
6. **Single active resume.** A candidate can keep only one active resume, so role-specific versions require re-uploading.
7. **Language.** The dictionary and stopword list are English-only.
8. **Explanation is arithmetic, not semantic.** It states which skills matched, not why a particular project is relevant.
9. **Scale.** Ranking tokenises every active resume per request; at tens of thousands of resumes this needs pre-computation or a search index.
10. **No email notifications or interview scheduling**, and no automated bias audit beyond the human-review safeguard.

---

## 22. Future Scope

1. **OCR fallback** (Tesseract) for scanned resumes, with a confidence indicator.
2. **Semantic embeddings** (sentence-transformers) blended with the current lexical score to capture synonyms and paraphrases.
3. **Skill taxonomy graph** — treat "React" as a specialisation of "JavaScript" and weight transferable skills.
4. **Weight tuning** — let a recruiter adjust skill/text weights per job, and validate the weights against historical hiring decisions.
5. **Resume versioning** — multiple active resumes per candidate, one per role family.
6. **Interview scheduling** with calendar integration and email notifications.
7. **Exportable reports** — PDF shortlists and CSV exports for placement cells.
8. **Bias and fairness dashboard** — measure score variance across education tiers and colleges.
9. **Elasticsearch or Atlas Search** for large-scale candidate retrieval before scoring.
10. **Mobile application** reusing the same REST API.
11. **Multi-language support** with per-language dictionaries and stopwords.
12. **Audit log** of every status change with the reviewing recruiter and timestamp.

---

## 23. Conclusion

The project delivers a complete, working recruitment platform rather than a static prototype. A candidate can register, upload a real PDF, see exactly what the server extracted, receive ranked job recommendations and apply. A recruiter can publish a vacancy, see every uploaded resume ranked against it with the matched and missing skills spelled out, and manage applicants through a status pipeline. The administrator can observe platform totals, score distribution, skill demand and recent activity.

The matching engine meets the central objective: it computes a genuine, reproducible percentage from the documents themselves, combining explicit skill evidence with TF-IDF cosine similarity, and it explains its output. Measured on the demo dataset, the ranking behaves the way a careful human reader would — the strongest MERN profile leads the MERN role, the frontend specialist leads the frontend role, the data analyst leads the analytics role, and unrelated profiles score near zero.

Equally important is what the system deliberately does not do: it never rejects a candidate automatically. Scores are visible evidence for a recruiter, not a verdict. Combined with bcrypt authentication, JWT role-based access, validated uploads and private file storage, the result is a mini project that is functional end to end, secure by design, and honest about the limits of lexical matching.

---

## 24. References

1. MongoDB Inc. *MongoDB Manual*. https://www.mongodb.com/docs/manual/
2. Mongoose. *Mongoose Documentation v8*. https://mongoosejs.com/docs/
3. OpenJS Foundation. *Express.js 4.x API Reference*. https://expressjs.com/en/4x/api.html
4. Meta Open Source. *React Documentation*. https://react.dev/
5. Vite. *Vite Guide*. https://vitejs.dev/guide/
6. Tailwind Labs. *Tailwind CSS Documentation*. https://tailwindcss.com/docs
7. Mozilla. *pdf.js / pdfjs-dist*. https://mozilla.github.io/pdf.js/
8. Auth0. *Introduction to JSON Web Tokens*. https://jwt.io/introduction
9. Provos, N. and Mazières, D. "A Future-Adaptable Password Scheme." *USENIX Annual Technical Conference*, 1999. (bcrypt)
10. Salton, G. and Buckley, C. "Term-weighting approaches in automatic text retrieval." *Information Processing & Management*, 24(5), 513–523, 1988. (TF-IDF)
11. Manning, C. D., Raghavan, P. and Schütze, H. *Introduction to Information Retrieval*. Cambridge University Press, 2008. (vector space model, cosine similarity)
12. Jurafsky, D. and Martin, J. H. *Speech and Language Processing*, 3rd edition draft. (tokenisation, stopword removal)
13. Recharts. *Recharts Documentation*. https://recharts.org/
14. OWASP Foundation. *OWASP Top 10 — Web Application Security Risks*. https://owasp.org/www-project-top-ten/
15. Nalanda Institute of Technology, Bhubaneswar — Department of Computer Science and Engineering, mini-project guidelines.

---

*No project member names or registration numbers are included in this report, the application, or its source code.*
