export const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || "https://contestify-nfd7.onrender.com";
export const ADMIN_SERVICE_URL = import.meta.env.VITE_ADMIN_SERVICE_URL || "https://contestify-admin-service.onrender.com";

export const getMediaUrl = (url) => {
  if (!url) return "";

  // Handle absolute HTTP/HTTPS URLs (Cloudinary CDN, S3, external links)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    let formattedUrl = url.replace(/^http:\/\//i, "https://");

    // Cloudinary URL Auto-Repair & Format Optimization
    if (formattedUrl.includes("res.cloudinary.com")) {
      // Insert automatic format, quality, and width parameters if not already present
      const uploadIdx = formattedUrl.indexOf("/upload/");
      if (uploadIdx !== -1) {
        const before = formattedUrl.slice(0, uploadIdx + 8); // include '/upload/'
        const after = formattedUrl.slice(uploadIdx + 8);
        const hasTransform = before.includes("f_auto") && before.includes("q_auto") && before.includes("w_600");
        const transform = hasTransform ? "" : "f_auto,q_auto,w_600/";
        formattedUrl = `${before}${transform}${after}`;
      }

      // 1. If stored under /image/upload/ but is a video, fix resource_type to /video/upload/
      if (formattedUrl.includes("/image/upload/") && (formattedUrl.match(/\.(mp4|mov|webm|mkv|avi)$/i) || formattedUrl.includes("/creator-contest-reels/"))) {
        formattedUrl = formattedUrl.replace("/image/upload/", "/video/upload/");
      }

      // 2. Ensure explicit format extension (.mp4) for HTML5 video player compatibility if missing extension
      if (formattedUrl.includes("/video/upload/") && !formattedUrl.match(/\.(mp4|mov|webm|mkv|avi|m3u8)$/i)) {
        formattedUrl = `${formattedUrl}.mp4`;
      }
    }

    return formattedUrl;
  }

  // Handle local relative upload paths (/uploads/filename.mp4)
  return `${USER_SERVICE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

