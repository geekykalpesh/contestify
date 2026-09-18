const CATEGORIES = [
  "Tech",
  "Art",
  "Music",
  "Gaming",
  "Fitness",
  "Food",
  "Travel",
  "Fashion",
  "Education",
  "Entertainment"
];

const ALLOWED_MIME_TYPES = {
  image: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/quicktime", "video/webm"]
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const CHHATTISGARH_RESIDENCY = "Chhattisgarh";

module.exports = {
  CATEGORIES,
  ALLOWED_MIME_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  CHHATTISGARH_RESIDENCY
};
