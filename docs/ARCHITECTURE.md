# 🏗️ Microservices Architecture & System Design

[⬅️ Back to Main README](../README.md) \| [🚀 Setup Guide](./SETUP_GUIDE.md) \| [🖥️ DB Inspection](./DATABASE_INSPECTION.md) \| [📡 API Ref](./API_REFERENCE.md) \| [🧮 Contest Math](./CONTEST_RULES_AND_RANKING.md)

The **Creator Contest Platform** is built using an enterprise microservices architecture designed for high scalability, fault tolerance, data decoupling, and real-time responsiveness.

---

## 📐 High-Level System Architecture

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │                              React Frontend                            │
 │             (Vite + Redux Toolkit + Tailwind CSS v4 + WebSockets)      │
 └───────────────────┬────────────────────────────────┬───────────────────┘
                     │                                │
           HTTP / REST (Port 5001)                HTTP / REST (Port 5002)
                     │                                │
                     ▼                                ▼
 ┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐
 │             User Service              │ │             Admin Service             │
 │         Express.js + MongoDB          │ │       Express.js + PostgreSQL         │
 │     (Auth, Posts, Media, Reactions)   │ │    (Prisma ORM + Ranking Engine)      │
 └───────────────────┬───────────────────┘ └───────────────────┬───────────────────┘
                     │                                         │
                     │ REST API (/api/internal/contest-data)   │
                     └─────────────────────────────────────────┘
                       (Admin fetches user/post metrics securely)
```

---

## 🔍 Microservices Breakdown

### 1. User Microservice (`/user-service`)
- **Port**: `5001`
- **Database**: MongoDB (`mongo:latest`) via Mongoose ORM
- **Cache**: Redis (`redis:latest`) via iORedis
- **Responsibilities**:
  - **User Authentication**: Signup, login, JWT token generation, password hashing (`bcryptjs`).
  - **Profile Management**: Profile picture uploads, Chhattisgarh residency status configuration.
  - **Video Reels Management**: HTTP 206 Range media streaming, category tagging (`Tech`, `Art`, `Music`, `Gaming`, `Fitness`, `Food`, `Travel`, `Fashion`, `Education`, `Entertainment`).
  - **Unseen Reel Algorithm**: Uses Redis Sets (`user:viewed:<userId>`) and MongoDB `$nin` queries so creators **never see the same video reel twice**.
  - **Atomic Reactions**: Likes, Comments, Views with compound unique indexes (`{ postId: 1, userId: 1 }`).
  - **KYC Submission**: Aadhaar number format validation, 10-digit mobile number validation, DOB age checks, and document image uploads.

---

### 2. Admin Microservice (`/admin-service`)
- **Port**: `5002`
- **Database**: PostgreSQL 16 (`postgres:16-alpine`) via Prisma ORM
- **Responsibilities**:
  - **Decoupled Data Aggregation**: Queries User Service via REST API (`GET /api/internal/contest-data`) using an internal secret header (`x-internal-secret`).
  - **33-Prize Priority Hierarchy Calculation Engine**: Computes single-post scores, 4-week consistency scores, category rankings, and applies strict 1-prize-per-creator constraints.
  - **Real-Time KYC Status Synchronization**: Pushes KYC approvals/rejections directly to User Service via `PUT /api/internal/user-kyc-status`.
  - **KYC Disqualification Cascade Engine**: Re-evaluates ranking cascade deterministically when a winner fails KYC.
  - **Audit Logging**: Persists status changes to the PostgreSQL `KycAuditLog` table.

---

### 3. React Frontend (`/frontend`)
- **Port**: `3000`
- **Stack**: React 18, Vite, Redux Toolkit, Tailwind CSS v4, Lucide React
- **Responsibilities**:
  - **Instagram UI Theme**: Sleek dark-mode aesthetic with story pills, reel player, and interactive cards.
  - **Admin Command Center**: Real-time winner table, 4-week creator audit table, directory search, minute-by-minute creator deep-dive tracking modal.
  - **Drag & Drop Upload**: KYC document dropzone with global default prevention (prevents browser from opening dropped files in a new tab).

---

## 🔒 Security & Inter-Service Authentication

Communication between `admin-service` and `user-service` is secured using a shared internal secret key:

```text
Header: x-internal-secret: internal-secret-token-creator-contest
```

If an unauthorized request attempts to access `/api/internal/*` without this header, the User Service rejects the connection with `403 Forbidden`.
