# 📁 Asset & Media Uploads Guide

[⬅️ Back to Main README](../README.md) \| [🚀 Setup Guide](./SETUP_GUIDE.md) \| [🏗️ Architecture](./ARCHITECTURE.md) \| [🖥️ DB Inspection](./DATABASE_INSPECTION.md) \| [📡 API Ref](./API_REFERENCE.md) \| [🧮 Contest Math](./CONTEST_RULES_AND_RANKING.md)

Instructions for downloading media reel assets and managing upload files in the **Creator Contest Platform**.

---

## 🔗 Google Drive Media Assets Download Link

All video reel files and sample document media are hosted on Google Drive:

📥 **[Download Google Drive Uploads Assets](https://drive.google.com/file/d/196tVBHxImEiVJD30cR4dnfl6QqmgZS42/view?usp=sharing)**

```text
https://drive.google.com/file/d/196tVBHxImEiVJD30cR4dnfl6QqmgZS42/view?usp=sharing
```

---

## 📂 How to Install Media Assets into Project

1. Click the Google Drive link above and download the zip file (`uploads.zip`).
2. Extract all `.mp4` video files, `.jpg`, `.png`, and `.webp` images.
3. Move/paste all extracted files directly into the User Service `uploads` folder:
   ```text
   user-service/uploads/
   ```
   *(Full path: `c:\Users\hrish\OneDrive\Desktop\emilo-task\user-service\uploads\`)*

---

## ⚡ Live Media Serving & Syncing

When running Docker Compose, the `docker-compose.yml` file is configured with a live volume mount:

```yaml
user-service:
  volumes:
    - ./user-service/uploads:/app/uploads
```

All files placed inside `user-service/uploads/` are immediately served live by Express at:
```text
http://localhost:5001/uploads/<filename>
```

When you execute the seed script:
```bash
docker exec creator-contest-user-service-container node /app/scripts/seed.js
```
The script automatically links these media files to 31 user accounts across 123 posts!
