export const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || "https://contestify-nfd7.onrender.com";
export const ADMIN_SERVICE_URL = import.meta.env.VITE_ADMIN_SERVICE_URL || "https://contestify-admin-service.onrender.com";

const HIGH_PERFORMANCE_REEL_FALLBACKS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutback2012.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4"
];

export const getMediaUrl = (url) => {
  if (!url) return "";

  // Handle absolute HTTP/HTTPS URLs (Cloudinary CDN, S3, external links)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    let formattedUrl = url.replace(/^http:\/\//i, "https://");

    // Cloudinary URL Auto-Repair & Format Optimization
    if (formattedUrl.includes("res.cloudinary.com")) {
      const isVideo =
        formattedUrl.includes("/video/upload/") ||
        formattedUrl.includes("/creator-contest-reels/") ||
        Boolean(formattedUrl.match(/\.(mp4|mov|webm|mkv|avi)$/i));

      if (isVideo) {
        // Fix resource_type if stored under /image/upload/ by mistake
        if (formattedUrl.includes("/image/upload/")) {
          formattedUrl = formattedUrl.replace("/image/upload/", "/video/upload/");
        }
        // Strip any accidental image transformation params (like w_600) inserted into video URLs
        if (formattedUrl.includes("/upload/f_auto,q_auto,w_600/")) {
          formattedUrl = formattedUrl.replace("/upload/f_auto,q_auto,w_600/", "/upload/");
        }
        // Ensure explicit format extension (.mp4) for HTML5 video player compatibility
        if (formattedUrl.includes("/video/upload/") && !formattedUrl.match(/\.(mp4|mov|webm|mkv|avi|m3u8)$/i)) {
          formattedUrl = `${formattedUrl}.mp4`;
        }
      } else {
        // Apply image transformations ONLY for non-video resources
        const uploadIdx = formattedUrl.indexOf("/upload/");
        if (uploadIdx !== -1) {
          const before = formattedUrl.slice(0, uploadIdx + 8);
          const after = formattedUrl.slice(uploadIdx + 8);
          const hasTransform = after.startsWith("f_auto") || after.startsWith("q_auto") || after.startsWith("w_600");
          if (!hasTransform) {
            formattedUrl = `${before}f_auto,q_auto/` + after;
          }
        }
      }
    }

    return formattedUrl;
  }

  // Handle local relative upload paths (/uploads/filename.mp4)
  return `${USER_SERVICE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

/**
 * Generates instant lightweight JPEG poster thumbnails for videos (TikTok/Instagram style).
 * For Cloudinary video URLs, generates /so_0,f_auto,q_auto,w_600/ JPEG frame.
 */
export const getMediaThumbnailUrl = (url, thumbnailUrl) => {
  if (thumbnailUrl) return getMediaUrl(thumbnailUrl);
  if (!url) return "";

  const mediaUrl = getMediaUrl(url);

  // Cloudinary instant video poster generation (start frame at 0 sec as 600px optimized JPEG)
  if (mediaUrl.includes("res.cloudinary.com")) {
    if (mediaUrl.includes("/video/upload/")) {
      return mediaUrl
        .replace("/video/upload/", "/video/upload/so_0,f_auto,q_auto,w_600/")
        .replace(/\.(mp4|mov|webm|mkv|avi)$/i, ".jpg");
    }
    if (mediaUrl.includes("/image/upload/")) {
      return mediaUrl
        .replace("/image/upload/", "/video/upload/so_0,f_auto,q_auto,w_600/")
        .replace(/\.(mp4|mov|webm|mkv|avi)$/i, ".jpg");
    }
  }

  return mediaUrl;
};
