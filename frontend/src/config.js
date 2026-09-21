export const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:5001";
export const ADMIN_SERVICE_URL = import.meta.env.VITE_ADMIN_SERVICE_URL || "http://localhost:5002";

export const getMediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${USER_SERVICE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};
