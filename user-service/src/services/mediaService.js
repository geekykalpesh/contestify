const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const processMediaUpload = async (file) => {
  const isVideo = file.mimetype.startsWith("video/");
  const mediaType = isVideo ? "video" : "image";

  // If Cloudinary configured, upload to Cloudinary CDN
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: mediaType,
        folder: "creator-contest-reels",
        quality: "auto",
        fetch_format: "auto"
      });

      // Remove local temp file
      fs.unlink(file.path, () => {});

      return {
        mediaUrl: result.secure_url,
        mediaType,
        publicId: result.public_id,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size
      };
    } catch (err) {
      console.warn("[Media Service] Cloudinary upload failed, falling back to local storage:", err.message);
    }
  }

  // Fallback: Serve Statically / Stream locally
  const filename = path.basename(file.path);
  const mediaUrl = `/uploads/${filename}`;

  return {
    mediaUrl,
    mediaType,
    originalFilename: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size
  };
};

const streamLocalVideo = (req, res, filename) => {
  const filePath = path.join(__dirname, "../../uploads", filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "Video file not found" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4"
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4"
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
};

module.exports = {
  processMediaUpload,
  streamLocalVideo
};
