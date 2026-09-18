# Project Custom Requirements & Notes

## 1. Feed Reel Visibility (Unseen Reels Only)
- **Requirement**: **User ko wapis se same reel/post nahi dikhni chahiye.** (Once a user views/watches a post or reel, it must NEVER be shown to that user again in their feed).

## 2. High-Performance Infinite Feed & Database Cost Optimization
- **Problem**: Infinite video scrolling could generate thousands of DB requests for views and feed fetches, raising server costs and crashing databases.
- **Production Solution / Strategy**:
  1. **Batch Video Fetching & Infinite Scroll (Pagination)**:
     - Frontend fetches videos in batches of 10-20 reels per API call (`limit=10`).
  2. **Lazy Loading Strategy (Frontend Optimization)**:
     - **Media Lazy Loading (`IntersectionObserver`)**: Videos and images only buffer/load when they scroll into the visible viewport ($\ge 50\%$ visible). Out-of-view videos automatically pause to save RAM, bandwidth, and CPU.
     - **Component Code Splitting (`React.lazy` + `Suspense`)**: Heavy pages like Admin Dashboard and Winner Analytics are lazy loaded, reducing initial page load bundle size.
     - **Image `loading="lazy"`**: Native lazy loading attribute for post thumbnail previews.
  3. **Client-Side View Buffering (Batch View Logging)**:
     - When user watches a reel, frontend doesn't hit DB immediately. It buffers `postId`s in memory (`viewBuffer`).
     - Every 5 views or every 10 seconds (or when leaving page), frontend sends a single batch payload `POST /api/posts/batch-view` containing `[postId1, postId2, ...]`.
     - Reduces DB write operations by **80%-90%**.
  4. **Redis Caching Strategy (In-Memory O(1) Lookups)**:
     - **What to store in Redis**: Post metadata JSONs (captions, author details, score, media URLs), `user:viewed:<userId>` sets, and `contest:rankings` sorted sets.
     - **Graceful Fallback**: Server checks if Redis is connected. If connected, uses Redis; if not, seamlessly falls back to Node.js in-memory Map & MongoDB compound indexes so it works zero-config in all environments.

## 3. Real-Time Interaction Updates (WebSockets / Socket.io)
- **Requirement**: Likes, comments, and view counts must update in **REAL-TIME** across all connected users.
- **Technology**: **Socket.io** on backend + `socket.io-client` on frontend.

## 4. Frontend Setup: Vite + Tailwind CSS v4 (`@tailwindcss/vite`)
- **Initialization**: `npm create vite@latest`
- **Tailwind Setup**:
  - Packages: `tailwindcss` + `@tailwindcss/vite`
  - `vite.config.js`:
    ```js
    import { defineConfig } from 'vite'
    import react from '@vitejs/plugin-react'
    import tailwindcss from '@tailwindcss/vite'

    export default defineConfig({
      plugins: [
        react(),
        tailwindcss()
      ]
    })
    ```
  - `src/index.css`: `@import "tailwindcss";`

## 5. Frontend State Management: Redux Toolkit (`@reduxjs/toolkit`)
- **Selected Library**: Redux Toolkit (RTK) + React-Redux.
- **Slices**: `authSlice`, `feedSlice`, `adminSlice`.
