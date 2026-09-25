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

const processThumbnailUpload = async (thumbnailFile, base64Thumbnail) => {
  if (thumbnailFile) {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        const result = await cloudinary.uploader.upload(thumbnailFile.path, {
          resource_type: "image",
          folder: "creator-contest-thumbnails",
          quality: "auto",
          fetch_format: "auto"
        });
        fs.unlink(thumbnailFile.path, () => {});
        return result.secure_url;
      } catch (err) {
        console.warn("[Media Service] Cloudinary thumbnail upload failed:", err.message);
      }
    }
    const filename = path.basename(thumbnailFile.path);
    return `/uploads/${filename}`;
  }

  if (base64Thumbnail && typeof base64Thumbnail === "string" && base64Thumbnail.startsWith("data:image/")) {
    try {
      const matches = base64Thumbnail.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === "png" ? "png" : "jpg";
        const base64Data = matches[2];
        const filename = `thumb_${Date.now()}_${Math.floor(Math.random() * 100000)}.${ext}`;
        const targetPath = path.join(__dirname, "../../uploads", filename);

        await fs.promises.writeFile(targetPath, Buffer.from(base64Data, "base64"));
        return `/uploads/${filename}`;
      }
    } catch (err) {
      console.warn("[Media Service] Failed to process base64 thumbnail:", err.message);
    }
  }

  return null;
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
  processThumbnailUpload,
  streamLocalVideo
};
