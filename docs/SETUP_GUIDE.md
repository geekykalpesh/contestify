# 🚀 Complete Setup & Deployment Guide

[⬅️ Back to Main README](../README.md) \| [🏗️ Architecture](./ARCHITECTURE.md) \| [🖥️ DB Inspection](./DATABASE_INSPECTION.md) \| [📡 API Ref](./API_REFERENCE.md) \| [🧮 Contest Math](./CONTEST_RULES_AND_RANKING.md)

This guide provides step-by-step instructions for installing, running, seeding, and evaluating the **Creator Contest Platform** microservices application.

> [!TIP]
> **Zero Configuration Required**: All `.env` files ([`user-service/.env`](../user-service/.env) & [`admin-service/.env`](../admin-service/.env)) are pre-configured and tracked in the repository. An evaluator does not need to manually copy or edit environment variables.

---

## ⚡ 1-Click Instant Copy-Paste Commands for Interviewers

If you are an interviewer or evaluator, you can set up the entire project, build all containers, seed 31 user accounts and 123 video reels, and calculate 33 contest prize winners in under **60 seconds**.

### Step 1: Clone Repository & Open Directory
```bash
git clone https://github.com/geekykalpesh/contestify.git
cd contestify
```

### Step 2: Launch All 6 Microservices in Docker
```bash
docker compose up -d --build
```

### Step 3: Seed Database & Calculate Initial Contest Winners
```bash
docker exec creator-contest-user-service-container node /app/scripts/seed.js
curl.exe -X POST http://localhost:5002/api/admin/calculate-winners
```

🎉 **That's it! Everything is running live!**

- **React Frontend**: `http://localhost:3000`
- **User Microservice API**: `http://localhost:5001`
- **Admin Microservice API**: `http://localhost:5002`

---

## 🔑 Demo Access Credentials

| User Type | Email | Password | Role / Access |
| :--- | :--- | :--- | :--- |
| **Admin User** | `admin@gmail.com` | `admin` | Full Access to Admin Command Center (`/admin`) |
| **Grand Prize Winner** | `aarav@creator.com` | `password123` | Creator Account (Grand Prize Winner) |
| **Multi-Category Leader** | `ananya@creator.com` | `password123` | Creator Account (Tech & Fashion Leader) |
| **Consistency Winner #1** | `rohan@creator.com` | `password123` | Creator Account (Food Vlogger) |
| **Consistency Winner #2** | `priya@creator.com` | `password123` | Creator Account (Travel Vlogger) |
| **Pending KYC Creator** | `vikram@creator.com` | `password123` | Creator Account (Fitness - Pending KYC) |

---

## 🧪 Testing Key Features

### 1. View Leaderboard & Admin Command Center
1. Navigate to `http://localhost:3000/auth` and log in as `admin@gmail.com` / `admin`.
2. Click **Admin Dashboard** in the top navigation header.
3. Review:
   - **33 Prize Allocation Hierarchy Table** (Shows Grand Prize, Consistency Winners, Top Performers, Category 1st & 2nd winners).
   - **Weekly Creator Audit Table** (Shows 4-week engagement stats, post counts, max score per week, consistency status).
   - **Creator Directory** (Searchable table of all 31 creators).
   - **PostgreSQL Audit Logs** (Real-time logs of KYC status changes).

### 2. Test Real-Time KYC Disqualification Cascade
1. On the Admin Dashboard (`http://localhost:3000/admin`), locate creator **Aarav Sharma (Grand Prize Candidate)**.
2. Click **Fail KYC (Cascade)**.
3. Observe real-time update:
   - Aarav is instantly removed from the 33 Winners table.
   - Next-in-line eligible creator is promoted automatically to Grand Prize!
   - Entry is recorded in the PostgreSQL `KycAuditLog` table.
4. Click **Pass KYC** to restore Aarav's eligibility and observe immediate re-computation.

### 3. Test Drag & Drop KYC Upload (Creator Profile)
1. Log in as `aarav@creator.com` / `password123`.
2. Go to `http://localhost:3000/profile` and click the **KYC Verification** tab.
3. Drag any image file from your desktop and drop it directly onto the upload zone.
4. Notice:
   - The file attaches without opening in a new tab.
   - Enter a 10-digit mobile number (e.g., `9876543210`) and 12-digit Aadhaar number (`1234 5678 9012`).
   - Click **Submit KYC Verification**.

---

## 🛠️ Port Reference Table

| Service | Container Name | Port | Description |
| :--- | :--- | :--- | :--- |
| **Frontend** | `creator-contest-frontend-container` | `3000` | React Vite Web App |
| **User Service** | `creator-contest-user-service-container` | `5001` | Express + MongoDB API |
| **Admin Service** | `creator-contest-admin-service-container` | `5002` | Express + PostgreSQL API |
| **MongoDB** | `creator-contest-mongodb-container` | `27017` | NoSQL Database |
| **PostgreSQL** | `creator-contest-postgres-container` | `5432` | Relational Database |
| **Redis** | `creator-contest-redis-container` | `6379` | In-Memory Cache & Sets |
