# 🖥️ Local Database Inspection & Connection Strings Guide

[⬅️ Back to Main README](../README.md) \| [🚀 Setup Guide](./SETUP_GUIDE.md) \| [🏗️ Architecture](./ARCHITECTURE.md) \| [📡 API Ref](./API_REFERENCE.md) \| [🧮 Contest Math](./CONTEST_RULES_AND_RANKING.md)

This guide provides both **Direct Copy-Paste Connection Strings** and **Step-by-Step Form Field Guides** for connecting to PostgreSQL in **pgAdmin 4**, MongoDB in **MongoDB Compass**, and Redis in **Redis CLI**.

---

## 🔑 Quick Copy-Paste Connection Strings Table

| Database / Service | Tool | Direct Copy-Paste Connection String |
| :--- | :--- | :--- |
| **PostgreSQL 16** | pgAdmin 4 | `postgresql://postgres:postgres@localhost:5432/creator_contest_admin_db` |
| **MongoDB** | MongoDB Compass | `mongodb://localhost:27017/creator_contest_user_db` |
| **Redis Cache** | Redis CLI / Desktop | `redis://localhost:6379` |

---

## 1. Inspecting PostgreSQL Tables in pgAdmin 4

### Method A: Quick Copy-Paste Connection String
1. Open **pgAdmin 4**.
2. Right-click **Servers** $\rightarrow$ **Register** $\rightarrow$ **Server...**
3. Select the **Connection** tab.
4. Under **Connection Service / Connection String**, paste:
   ```text
   postgresql://postgres:postgres@localhost:5432/creator_contest_admin_db
   ```
5. Click **Save**.

### Method B: Step-by-Step Field Configuration
1. Open **pgAdmin 4** $\rightarrow$ Right-click **Servers** $\rightarrow$ **Register** $\rightarrow$ **Server...**
2. **General Tab**:
   - Name: `Creator Contest Postgres`
3. **Connection Tab**:
   - **Host name / address**: `localhost` (or `127.0.0.1`)
   - **Port**: `5432`
   - **Maintenance database**: `creator_contest_admin_db`
   - **Username**: `postgres`
   - **Password**: `postgres`
4. Click **Save**.

### How to View Data Tables:
1. Expand **Servers** $\rightarrow$ **Creator Contest Postgres** $\rightarrow$ **Databases** $\rightarrow$ `creator_contest_admin_db`.
2. Expand **Schemas** $\rightarrow$ `public` $\rightarrow$ **Tables**.
3. View tables:
   - `Winner` (Stores the 33 calculated contest winners, category slots, and KYC statuses)
   - `KycAuditLog` (Stores audit logs when Admin passes or fails a creator's KYC)
4. Right-click `Winner` or `KycAuditLog` $\rightarrow$ **View/Edit Data** $\rightarrow$ **All Rows**.

---

## 2. Inspecting MongoDB Collections in MongoDB Compass

### Method A: Direct Connection String (Instant Database Open)
1. Open **MongoDB Compass**.
2. In the connection URI input box, paste:
   ```text
   mongodb://localhost:27017/creator_contest_user_db
   ```
3. Click **Connect**.
4. Compass automatically connects and opens `creator_contest_user_db`.

### Method B: Standard Host Connection
1. Open **MongoDB Compass**.
2. Paste `mongodb://localhost:27017` and click **Connect**.
3. Select `creator_contest_user_db` from the left database menu.

### Collections to Inspect:
- `users`: User accounts, residency ("Chhattisgarh"), password hashes, role, and `kycDetails`.
- `posts`: Video reel posts, category, engagement counts (`likeCount`, `commentCount`, `viewCount`).
- `likes`: Compound unique index records `{ postId, userId }`.
- `comments`: Comment strings and timestamps.
- `views`: Recorded view records.

---

## 3. Inspecting Redis Keys via CLI

### Connection String:
```text
redis://localhost:6379
```

### Run Redis CLI in Docker Container:
```bash
docker exec -it creator-contest-redis-container redis-cli
```

### Useful Commands:
- **View all active keys**: `KEYS *`
- **List unseen feed viewed sets**: `KEYS user:viewed:*`
- **Inspect viewed reels for a user**: `SMEMBERS user:viewed:<userId>`
- **Flush cache**: `FLUSHALL`
