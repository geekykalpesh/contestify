# 📡 Complete API Reference

[⬅️ Back to Main README](../README.md) \| [🚀 Setup Guide](./SETUP_GUIDE.md) \| [🏗️ Architecture](./ARCHITECTURE.md) \| [🖥️ DB Inspection](./DATABASE_INSPECTION.md) \| [🧮 Contest Math](./CONTEST_RULES_AND_RANKING.md)

All API endpoints supported across the **User Service** (`http://localhost:5001`) and **Admin Service** (`http://localhost:5002`).

---

## 1. User Service APIs (`http://localhost:5001`)

### Authentication Endpoints

#### `POST /api/auth/signup`
- **Request Body**:
  ```json
  {
    "name": "Creator Name",
    "email": "user@creator.com",
    "password": "password123",
    "residency": "Chhattisgarh"
  }
  ```
- **Response**: `201 Created` with JWT token and user object.

#### `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "user@creator.com",
    "password": "password123"
  }
  ```
- **Response**: `200 OK` with JWT token.

#### `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with logged-in user profile & KYC status.

#### `PUT /api/auth/kyc`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `aadharNumber`: String (12 digits, e.g. `1234 5678 9012`)
  - `aadharMobile`: String (10 digits, e.g. `9876543210`)
  - `dob`: String (`YYYY-MM-DD`)
  - `aadharImage`: File (JPEG, PNG, WEBP up to 10MB)
- **Response**: `200 OK` with updated KYC status (`PENDING`).

---

### Posts & Reel Endpoints

#### `GET /api/posts/feed`
- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `page` (default 1), `limit` (default 10)
- **Behavior**: Streams unseen video reels (filtered via Redis `user:viewed:<userId>` sets).

#### `POST /api/posts`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Form Data**: `caption`, `category`, `media` (video/image file)
- **Response**: `201 Created`.

#### `POST /api/posts/:id/like`
- **Headers**: `Authorization: Bearer <token>`
- **Behavior**: Atomically toggles like status on a post using MongoDB `$inc`.

#### `POST /api/posts/:id/comment`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ "text": "Awesome video!" }`
- **Response**: `201 Created`.

#### `POST /api/posts/:id/view`
- **Headers**: `Authorization: Bearer <token>`
- **Behavior**: Records video view and updates Redis viewed set.

---

## 2. Admin Service APIs (`http://localhost:5002`)

#### `GET /api/admin/winners`
- **Response**: `200 OK` returning 33 contest winners categorized by rank index and prize category.

#### `POST /api/admin/calculate-winners`
- **Behavior**: Executes full ranking engine algorithm and upserts PostgreSQL `Winner` table.

#### `PUT /api/admin/kyc/:winnerId`
- **Request Body**:
  ```json
  {
    "status": "FAILED",
    "reason": "Document blur - invalid Aadhaar"
  }
  ```
- **Behavior**: Updates winner KYC status, triggers real-time winner re-computation & cascade, logs entry in PostgreSQL `KycAuditLog`, and syncs status to User Service.

#### `GET /api/internal/contest-data`
- **Headers**: `x-internal-secret: internal-secret-token-creator-contest`
- **Response**: `200 OK` returning all users and posts metric data for contest evaluation.
