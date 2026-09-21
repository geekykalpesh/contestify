# 🏆 Creator Contest Platform - Full-Stack Microservices System

An enterprise-grade microservices platform for managing video reel contests, creator engagements, real-time leaderboards, KYC verification, and prize allocation cascades.

---

## 🎥 Platform Video Overview & Live Demo

https://github.com/geekykalpesh/contestify/raw/main/contestify.mp4

<p align="center">
  <video src="https://github.com/geekykalpesh/contestify/raw/main/contestify.mp4" controls="controls" width="100%" style="max-width: 100%; border-radius: 12px;">
    Your browser does not support the video tag.
  </video>
</p>

> [!TIP]
> Click play above to watch the full platform walkthrough video directly inside GitHub! You can also view or download the raw overview video file: [`contestify.mp4`](./contestify.mp4).

---

## 🚀 Complete Step-by-Step Setup Guide (Zero Configuration)

If you are cloning this repository on a new computer, follow these **5 simple steps** to get the application up and running with live video reels and calculated contest winners:

### Step 1: Clone Repository & Open Directory
Open your terminal and run:
```bash
git clone https://github.com/geekykalpesh/contestify.git
cd contestify
```

### Step 2: Download & Place Video Reels from Google Drive
1. Open the Google Drive link to download the media assets zip:
   📥 **[Download Google Drive Video Reels Zip](https://drive.google.com/file/d/196tVBHxImEiVJD30cR4dnfl6QqmgZS42/view?usp=sharing)**
2. Download `uploads.zip` to your computer and extract all files.
3. Move/paste all extracted `.mp4` video reel files into the **`video_reels_100plus`** folder located in the root directory:
   ```text
   contestify/video_reels_100plus/
   ```

### Step 3: Launch All 6 Microservices in Docker
Build and start all containers (Frontend, User Service, Admin Service, MongoDB, PostgreSQL, and Redis):
```bash
docker compose up -d --build
```

### Step 4: Seed Database & Calculate 33 Contest Winners
Run this single command in your terminal to automatically sync all `.mp4` files from `video_reels_100plus` into `user-service/uploads`, seed MongoDB with 30 user accounts & 123 posts, and calculate the 33 contest prize winners:
```bash
docker exec creator-contest-user-service-container node /app/scripts/seed.js; curl.exe -X POST http://localhost:5002/api/admin/calculate-winners
```

### Step 5: Access the Live Application
Open your browser and navigate to:
- 🌐 **React Frontend Web App**: `http://localhost:3000`
- 📡 **User Microservice API**: `http://localhost:5001`
- ⚙️ **Admin Microservice API**: `http://localhost:5002`

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


