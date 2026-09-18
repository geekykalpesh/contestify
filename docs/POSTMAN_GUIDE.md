# 🚀 Postman Collection & Testing Guide

[⬅️ Back to Main README](../README.md) \| [🚀 Setup Guide](./SETUP_GUIDE.md) \| [🏗️ Architecture](./ARCHITECTURE.md) \| [🖥️ DB Inspection](./DATABASE_INSPECTION.md) \| [📡 API Ref](./API_REFERENCE.md) \| [🧮 Contest Math](./CONTEST_RULES_AND_RANKING.md)

This guide explains how to import and use the production Postman Collection file ([`docs/Creator_Contest_Platform.postman_collection.json`](./Creator_Contest_Platform.postman_collection.json)) to test all User Service, Admin Service, and Internal security endpoints.

---

## 📥 Step 1: Import Collection into Postman

1. Open **Postman**.
2. Click **Import** (top-left button).
3. Drag & drop or select the file from your local repository:
   ```text
   docs/Creator_Contest_Platform.postman_collection.json
   ```
4. Click **Import**. You will see the **Creator Contest Platform Microservices** collection appear in your left sidebar.

---

## ⚙️ Step 2: Pre-Configured Variables & Environment

The collection comes pre-configured with collection variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `user_service_url` | `http://localhost:5001` | User Microservice base URL |
| `admin_service_url` | `http://localhost:5002` | Admin Microservice base URL |
| `authToken` | *(Auto-populated)* | Saved automatically when running Login requests |
| `internalSecret` | `internal-secret-token-creator-contest` | Security secret for inter-service communication |
| `winnerId` | *(Auto-populated)* | Winner ID extracted when running `Fetch 33 Contest Winners Table` |

---

## 🧪 Step 3: Recommended Testing Order

### 1. Health Checks (`Folder 1. Health Checks`)
- Run `User Service Health` $\rightarrow$ Expect `200 OK` (`"status": "UP"`).
- Run `Admin Service Health` $\rightarrow$ Expect `200 OK` (`"status": "UP"`).

### 2. Authentication & JWT Auto-Extraction (`Folder 2. Authentication`)
- Run `Login (Creator Candidate - Aarav)` $\rightarrow$ Returns JWT token.
  - *Postman test script automatically sets `{{authToken}}` in collection variables!*
- Run `Get Logged In User / Me` $\rightarrow$ Expect `200 OK` with user details & KYC status.
- Run `Submit KYC Verification` $\rightarrow$ Validates 12-digit Aadhaar number and 10-digit mobile number.

### 3. Posts & Feed (`Folder 3. Posts & Media Feed`)
- Run `Get Unseen Video Reels Feed` $\rightarrow$ Returns video reels filtered via Redis unseen set.

### 4. Admin Ranking Engine (`Folder 4. Admin Engine`)
- Run `Fetch 33 Contest Winners Table` $\rightarrow$ Returns 33 prize slots from PostgreSQL.
  - *Postman test script automatically extracts `{{winnerId}}` of Rank #1 winner!*
- Run `Fail Winner KYC` $\rightarrow$ Sets status to `FAILED`.
  - *Triggers automatic re-computation, promotes next-in-line creator, and records entry in PostgreSQL `KycAuditLog`!*
- Run `Pass Winner KYC` $\rightarrow$ Restores creator eligibility and updates leaderboard in real-time.

### 5. Internal Microservice Security (`Folder 5. Internal Microservice APIs`)
- Run `Get Internal Contest Metric Data` $\rightarrow$ Uses `x-internal-secret` header to fetch raw contest metrics from User Service.
