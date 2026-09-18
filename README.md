# 🏆 Creator Contest Platform - Full-Stack Microservices System

An enterprise-grade microservices platform for managing video reel contests, creator engagements, real-time leaderboards, KYC verification, and prize allocation cascades.

---

## 🎥 Platform Video Overview & Live Demo

https://raw.githubusercontent.com/geekykalpesh/contestify/main/contestify.mp4

<p align="center">
  <video src="https://raw.githubusercontent.com/geekykalpesh/contestify/main/contestify.mp4" controls="controls" muted="muted" width="100%" style="max-width: 100%; border-radius: 12px;">
    Your browser does not support the video tag.
  </video>
</p>

> [!TIP]
> Click play above to watch the full platform walkthrough video directly inside GitHub! You can also view or download the raw overview video file: [`contestify.mp4`](./contestify.mp4).

---

## ⚡ 1-Click Instant Copy-Paste Commands for Interviewers

If you are an interviewer or evaluator, run these **2 terminal commands** from the project root directory to launch all 6 microservices, seed 31 user accounts and 123 video reels, and calculate the 33 contest prize winners:

### Command 1: Launch Microservices in Docker
```bash
docker compose up -d --build
```

### Command 2: Seed Database & Calculate 33 Winners
```bash
docker exec creator-contest-user-service-container node /app/scripts/seed.js; curl.exe -X POST http://localhost:5002/api/admin/calculate-winners
```

🎉 **Live System URLs**:
- **React Frontend**: `http://localhost:3000`
- **User Service API**: `http://localhost:5001`
- **Admin Service API**: `http://localhost:5002`

---

## 🔌 Database Single Connection Strings

| Database / Service | Tool | Direct Copy-Paste Connection String |
| :--- | :--- | :--- |
| **PostgreSQL 16** | pgAdmin 4 | `postgresql://postgres:postgres@localhost:5432/creator_contest_admin_db` |
| **MongoDB** | MongoDB Compass | `mongodb://localhost:27017/creator_contest_user_db` |
| **Redis Cache** | Redis CLI | `redis://localhost:6379` |

---

## 🔑 Demo Access Credentials

| Role | Email | Password | Access / Notes |
| :--- | :--- | :--- | :--- |
| **Admin User** | `admin@gmail.com` | `admin` | Full Access to Admin Dashboard & Winner Cascade Controls |
| **Standard User** | `user@gmail.com` | `user` | Standard Creator / User Account |
| **Grand Prize Winner** | `aarav@creator.com` | `password123` | Creator Account (Grand Prize Winner Candidate) |
| **Multi-Category Leader** | `ananya@creator.com` | `password123` | Creator Account (Tech & Fashion Leader) |
| **Consistency Winner #1** | `rohan@creator.com` | `password123` | Creator Account (Food Vlogger) |
| **Pending KYC Creator** | `vikram@creator.com` | `password123` | Creator Account (Fitness - Pending KYC) |

---

## 📚 Detailed Documentation Suite (`/docs`)

Click any link below to open step-by-step documentation guides:

1. 🚀 [**Setup & Deployment Guide**](./docs/SETUP_GUIDE.md) — 1-Click setup, copy-paste terminal commands, demo login credentials, and feature testing walkthrough.
2. 📬 [**Postman Collection & Guide**](./docs/POSTMAN_GUIDE.md) — Downloadable Postman v2.1.0 Collection ([`Creator_Contest_Platform.postman_collection.json`](./docs/Creator_Contest_Platform.postman_collection.json)) with auto-storing JWT scripts & variables.
3. 🏗️ [**Microservices Architecture**](./docs/ARCHITECTURE.md) — System design, WebSockets, Redis unseen feed filter, decoupled database architecture, and security headers.
4. 🖥️ [**Local Database Inspection Guide**](./docs/DATABASE_INSPECTION.md) — Single connection strings & step-by-step visual connection steps for pgAdmin 4 (PostgreSQL) and MongoDB Compass.
5. 📡 [**Complete API Reference**](./docs/API_REFERENCE.md) — Exhaustive specification for Auth, Posts, Reactions, KYC, Admin, and Internal security endpoints.
6. 🧮 [**Contest Rules & Ranking Math**](./docs/CONTEST_RULES_AND_RANKING.md) — Engagement scoring formula, tie-breaker order, 33-prize hierarchy, multi-category cascade rules, and KYC disqualification cascade.
7. 📁 [**Asset & Media Uploads Guide**](./docs/ASSETS_AND_UPLOADS.md) — Managing video reels and Google Drive uploaded files.

---

## 📸 System Overview

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

## 🐙 Push Code to GitHub Repository

```bash
git remote set-url origin https://github.com/geekykalpesh/contestify.git
git add .
git commit -m "feat: complete production-ready creator contest platform with microservices, kyc cascade, and docs"
git push origin main
```

---

## ✉️ Professional Email Submission Template

**Subject**: Full-Stack Submission: Creator Contest Microservices Platform

**Body**:

Dear Evaluator / Team,

I have completed the development and testing of the **Creator Contest Platform**, built using a production-ready Node.js, Express, React, PostgreSQL, MongoDB, Redis, and Docker microservices architecture.

### Key Technical Highlights:
1. **Microservices Architecture**:
   - `User Service` (Express + MongoDB + Redis): User authentication, profile, video reel uploads, reactions, and unseen feed filtering.
   - `Admin Service` (Express + PostgreSQL + Prisma): Decoupled ranking engine, 33-prize priority allocation hierarchy, and real-time KYC audit logging.
   - `Frontend` (React + Redux Toolkit + Tailwind CSS v4): Instagram-style UI, drag-and-drop document upload with strict 10-digit mobile number validation, minute-by-minute creator deep-dive modals, and real-time KYC verification toggles.

2. **Real-Time KYC & Prize Allocation Cascade**:
   - Toggling a creator's KYC status to `FAILED` in the Admin Panel automatically excludes them from contest eligibility, promotes next-in-line creators across category & consistency slots in real-time, and logs an audit entry in PostgreSQL.

3. **Repository & 1-Click Setup**:
   - **GitHub Repository**: https://github.com/geekykalpesh/contestify
   - **Google Drive Assets**: https://drive.google.com/file/d/196tVBHxImEiVJD30cR4dnfl6QqmgZS42/view?usp=sharing
   - **Pre-Configured Environment**: All `.env` files (`user-service/.env` & `admin-service/.env`) are tracked in the repository for **100% zero-configuration setup**.
   - **Quickstart Commands**:
     ```bash
     docker compose up -d --build
     docker exec creator-contest-user-service-container node /app/scripts/seed.js; curl.exe -X POST http://localhost:5002/api/admin/calculate-winners
     ```

### Demo Credentials:
- **Admin**: `admin@gmail.com` / `admin`
- **Creator Candidate**: `aarav@creator.com` / `password123`

Comprehensive documentation, database schema diagrams, API references, single connection strings for pgAdmin 4 / MongoDB Compass, and Postman collections are included in the repository `README.md` and `/docs` directory.

Thank you for your time and review.

Best regards,  
Kalpesh
