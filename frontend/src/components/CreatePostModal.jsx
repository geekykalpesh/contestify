import React, { useState, useEffect, useRef } from "react";
import { userApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { X, UploadCloud, Film, Image as ImageIcon, Sparkles, Sliders, Camera, Check } from "lucide-react";

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

export const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const { toast } = useToast();
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("Tech");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Cover / Thumbnail Selection States (Instagram Style)
  const [coverMode, setCoverMode] = useState("scrub"); // 'scrub' | 'upload'
  const [videoDuration, setVideoDuration] = useState(0);
  const [scrubTime, setScrubTime] = useState(0);
  const [thumbnailData, setThumbnailData] = useState(null); // Base64 canvas data
  const [thumbnailFile, setThumbnailFile] = useState(null); // Custom image file
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState(null);

  const fileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);
  const videoScrubberRef = useRef(null);
  const canvasRef = useRef(null);

  // Prevent browser default behavior of opening dropped files in a new tab when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const preventBrowserDefault = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("dragover", preventBrowserDefault, false);
    window.addEventListener("drop", preventBrowserDefault, false);

    return () => {
      window.removeEventListener("dragover", preventBrowserDefault, false);
      window.removeEventListener("drop", preventBrowserDefault, false);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const processSelectedFile = (selected) => {
    if (!selected) return;

    setError(null);
    const isImage = selected.type.startsWith("image/");
    const isVideo = selected.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setError("Only JPEG, PNG, WEBP images and MP4, MOV videos are allowed.");
      return;
    }

    const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (selected.size > maxSize) {
      setError(`File size exceeds limit of ${isImage ? "10MB" : "50MB"}`);
      return;
    }

    setFile(selected);
    const type = isVideo ? "video" : "image";
    setMediaType(type);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);

    // Reset cover selections
    setThumbnailData(null);
    setThumbnailFile(null);
    setThumbnailPreviewUrl(null);
    setScrubTime(0);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    processSelectedFile(selected);
  };

  // Video Loaded Metadata -> Get duration & capture initial frame
  const handleLoadedMetadata = () => {
    if (videoScrubberRef.current) {
      const dur = videoScrubberRef.current.duration || 0;
      setVideoDuration(dur);
      captureCurrentFrame();
    }
  };

  // Handle Scrub Range Change
  const handleScrubChange = (e) => {
    const time = parseFloat(e.target.value);
    setScrubTime(time);
    if (videoScrubberRef.current) {
      videoScrubberRef.current.currentTime = time;
    }
  };

  // Capture frame from video HTML5 canvas
  const captureCurrentFrame = () => {
    if (!videoScrubberRef.current || !canvasRef.current) return;
    const video = videoScrubberRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setThumbnailData(dataUrl);
      setThumbnailFile(null);
      setThumbnailPreviewUrl(dataUrl);
    }
  };

  // Handle Custom Cover Image Upload
  const handleCustomCoverChange = (e) => {
    const customFile = e.target.files[0];
    if (customFile && customFile.type.startsWith("image/")) {
      setThumbnailFile(customFile);
      setThumbnailData(null);
      setThumbnailPreviewUrl(URL.createObjectURL(customFile));
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      processSelectedFile(droppedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim()) {
      setError("Please enter a caption");
      return;
    }
    if (!file) {
      setError("Please select a media file (image or video)");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("category", category);
      formData.append("media", file);

      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      } else if (thumbnailData) {
        formData.append("thumbnailData", thumbnailData);
      }

      await userApi.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setCaption("");
      setFile(null);
      setPreviewUrl(null);
      setThumbnailData(null);
      setThumbnailFile(null);
      setThumbnailPreviewUrl(null);
      toast.success("Your post has been published successfully!", "Post Published");
      onClose();
      if (onPostCreated) onPostCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      {/* Off-screen canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="ig-card w-full max-w-lg rounded-2xl p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-slate-500/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-sky-500" />
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Create New Post</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Picker / Preview Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Media File (Image max 10MB, Video max 50MB)
            </label>
            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-black border border-[var(--border-main)] group">
                {mediaType === "video" ? (
                  <video
                    ref={videoScrubberRef}
                    src={previewUrl}
                    controls
                    onLoadedMetadata={handleLoadedMetadata}
                    onSeeked={captureCurrentFrame}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    setThumbnailData(null);
                    setThumbnailFile(null);
                    setThumbnailPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 bg-black/80 text-white hover:bg-black p-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm"
                >
                  Change File
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-sky-500 bg-sky-500/15 scale-[1.01]"
                    : "border-[var(--border-main)] hover:border-sky-500 bg-slate-500/5 hover:bg-slate-500/10"
                }`}
              >
                <UploadCloud className={`w-8 h-8 mb-2 transition-transform pointer-events-none ${isDragging ? "text-sky-400 scale-110" : "text-sky-500"}`} />
                <span className="text-xs font-medium text-[var(--text-primary)] pointer-events-none">
                  {isDragging ? "Drop file here to upload" : "Click or drag file to upload"}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] mt-1 pointer-events-none">
                  Supports JPEG, PNG, WEBP, MP4, MOV
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Instagram-Style Cover/Thumbnail Selector (Video Only) */}
          {mediaType === "video" && previewUrl && (
            <div className="p-3.5 rounded-xl bg-slate-500/5 border border-[var(--border-main)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  <Camera className="w-4 h-4 text-sky-400" />
                  <span>Choose Cover Thumbnail</span>
                </div>
                <div className="flex bg-[var(--bg-main)] p-0.5 rounded-lg border border-[var(--border-main)] text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => setCoverMode("scrub")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      coverMode === "scrub"
                        ? "bg-sky-500 text-white font-bold shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Scrub Frame
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverMode("upload")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      coverMode === "upload"
                        ? "bg-sky-500 text-white font-bold shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Upload Custom
                  </button>
                </div>
              </div>

              {coverMode === "scrub" ? (
                <div className="space-y-2">
                  <label className="flex justify-between items-center text-[11px] text-[var(--text-secondary)]">
                    <span>Drag slider to pick cover timestamp:</span>
                    <span className="font-mono font-bold text-sky-400">{scrubTime.toFixed(1)}s / {videoDuration.toFixed(1)}s</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={videoDuration || 10}
                    step={0.1}
                    value={scrubTime}
                    onChange={handleScrubChange}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={captureCurrentFrame}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-[11px] font-semibold border border-sky-500/30"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Set Current Frame as Cover</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 border border-dashed border-[var(--border-main)] rounded-lg hover:border-sky-500 bg-[var(--bg-main)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4 text-sky-400" />
                    <span>Upload Custom Cover Image (.jpg, .png, .webp)</span>
                  </button>
                  <input
                    type="file"
                    ref={coverFileInputRef}
                    accept="image/*"
                    onChange={handleCustomCoverChange}
                    className="hidden"
                  />
                </div>
              )}

              {/* Cover Preview Tile */}
              {thumbnailPreviewUrl && (
                <div className="flex items-center gap-3 pt-1 border-t border-[var(--border-main)]/50">
                  <div className="w-16 h-12 rounded-lg overflow-hidden border border-sky-500/50 bg-black shrink-0 relative">
                    <img src={thumbnailPreviewUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0.5 right-0.5 bg-emerald-500 text-white rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-emerald-400">Cover Thumbnail Ready</p>
                    <p className="text-[10px] text-[var(--text-muted)]">This cover will be shown on feed & profiles before video plays.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Post Caption
            </label>
            <textarea
              rows={3}
              placeholder="Write a catchy caption for your post..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Category (Select 1 of 10)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    category === cat
                      ? "ig-btn-primary shadow-sm"
                      : "bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-main)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white ig-btn-primary disabled:opacity-50 rounded-xl shadow-md transition-all"
            >
              {submitting ? "Uploading..." : "Publish Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
