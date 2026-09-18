import React, { useState, useEffect, useRef } from "react";
import { userApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { X, UploadCloud, Film, Image as ImageIcon, Sparkles } from "lucide-react";

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
  const fileInputRef = useRef(null);

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
    setMediaType(isVideo ? "video" : "image");
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    processSelectedFile(selected);
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

      await userApi.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setCaption("");
      setFile(null);
      setPreviewUrl(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="ig-card w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
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
                  <video src={previewUrl} controls className="w-full h-full object-contain" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
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
