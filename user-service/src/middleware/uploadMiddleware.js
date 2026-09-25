const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { ALLOWED_MIME_TYPES, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } = require("../config/constants");

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = file.originalname.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, `${sanitizedBase}_${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const isImage = ALLOWED_MIME_TYPES.image.includes(file.mimetype);
  const isVideo = ALLOWED_MIME_TYPES.video.includes(file.mimetype);

  if (!isImage && !isVideo) {
    return cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WEBP images and MP4, MOV, WEBM videos are allowed."
      ),
      false
    );
  }

  // Attach media type to request body for reference
  req.mediaType = isVideo ? "video" : "image";
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE // Default upper bound limit 50MB
  }
});

// Middleware to enforce specific size limit based on media type
const validateFileSize = (req, res, next) => {
  const mediaFile = req.file || (req.files && req.files.media && req.files.media[0]);
  if (!mediaFile) {
    return res.status(400).json({ success: false, message: "Media file is required" });
  }

  const isImage = ALLOWED_MIME_TYPES.image.includes(mediaFile.mimetype);
  const limit = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

  if (mediaFile.size > limit) {
    // Delete invalid file from disk
    fs.unlink(mediaFile.path, () => {});
    return res.status(400).json({
      success: false,
      message: `File size exceeds the limit of ${isImage ? "10MB" : "50MB"}`
    });
  }

  // Attach target file to req.file for standard access downstream
  if (!req.file && mediaFile) {
    req.file = mediaFile;
  }

  next();
};

module.exports = {
  uploadSingleMedia: upload.single("media"),
  uploadPostMedia: upload.fields([
    { name: "media", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
  ]),
  uploadSingleAvatar: upload.single("avatar"),
  uploadKycDoc: upload.single("aadharImage"),
  validateFileSize
};
