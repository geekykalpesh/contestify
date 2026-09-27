export const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || "https://contestify-nfd7.onrender.com";
export const ADMIN_SERVICE_URL = import.meta.env.VITE_ADMIN_SERVICE_URL || "https://contestify-admin-service.onrender.com";

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

