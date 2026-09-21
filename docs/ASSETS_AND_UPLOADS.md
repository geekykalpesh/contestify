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
3. Move/paste all extracted `.mp4` video reel files into the `video_reels_100plus` folder in the root project directory:
   ```text
   contestify/video_reels_100plus/
   ```
4. Run the seed and calculation command from your terminal:
   ```bash
   docker exec creator-contest-user-service-container node /app/scripts/seed.js; curl.exe -X POST http://localhost:5002/api/admin/calculate-winners
   ```

---

## ⚡ Live Media Serving & Automatic Syncing

When running Docker Compose, the seed script automatically scans the `video_reels_100plus` folder, syncs all `.mp4` files into `user-service/uploads/`, and links them to database posts.

The `docker-compose.yml` file mounts this folder live:

```yaml
user-service:
  volumes:
    - ./user-service/uploads:/app/uploads
    - ./video_reels_100plus:/app/video_reels_100plus
```

All files inside `user-service/uploads/` are immediately served live by Express at:
```text
http://localhost:5001/uploads/<filename>
```

Executing the seed command:
```bash
docker exec creator-contest-user-service-container node /app/scripts/seed.js
```
automatically syncs all reel files from `video_reels` into `user-service/uploads` and links them to user posts on the UI feed!
