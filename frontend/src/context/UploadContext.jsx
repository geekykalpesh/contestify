import React, { createContext, useContext, useState, useCallback } from "react";
import { userApi } from "../services/api";
import { fetchFeed } from "../store/feedSlice";
import { useDispatch } from "react-redux";
import { CheckCircle2, Film, Loader2, X, AlertCircle } from "lucide-react";

const UploadContext = createContext(null);

export const UploadProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [uploadTask, setUploadTask] = useState(null);

  const startUpload = useCallback(async ({ formData, previewUrl, caption, onSuccess, onError }) => {
    const taskId = Date.now();
    setUploadTask({
      id: taskId,
      progress: 0,
      status: "Uploading media...",
      previewUrl,
      caption: caption ? (caption.length > 35 ? caption.slice(0, 35) + "..." : caption) : "New Reel",
      state: "uploading",
      errorMsg: null
    });

    try {
      await userApi.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || progressEvent.bytes || 1;
          const loaded = progressEvent.loaded || 0;
          const percent = Math.min(99, Math.round((loaded * 100) / total));

          setUploadTask((prev) => {
            if (!prev || prev.id !== taskId) return prev;
            return {
              ...prev,
              progress: percent,
              status: percent >= 98 ? "Processing & optimizing media..." : `Uploading (${percent}%)...`,
              state: percent >= 98 ? "processing" : "uploading"
            };
          });
        }
      });

      // Upload & Server Processing complete!
      setUploadTask((prev) => {
        if (!prev || prev.id !== taskId) return prev;
        return {
          ...prev,
          progress: 100,
          status: "Post published successfully!",
          state: "completed"
        };
      });

      // Dispatch global events & refresh feed
      window.dispatchEvent(new Event("post_created"));
      dispatch(fetchFeed({ page: 1 }));

      if (onSuccess) onSuccess();

      // Auto dismiss completed banner after 3.5 seconds
      setTimeout(() => {
        setUploadTask((prev) => (prev && prev.id === taskId ? null : prev));
      }, 3500);

    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to publish post";
      setUploadTask((prev) => {
        if (!prev || prev.id !== taskId) return prev;
        return {
          ...prev,
          status: "Upload failed",
          state: "error",
          errorMsg
        };
      });
      if (onError) onError(errorMsg);
    }
  }, [dispatch]);

  const dismissTask = useCallback(() => {
    setUploadTask(null);
  }, []);

  return (
    <UploadContext.Provider value={{ startUpload, uploadTask, dismissTask }}>
      {children}
      {/* Floating Instagram/TikTok Style Progress Banner */}
      {uploadTask && (
        <div className="fixed top-16 right-4 z-[999] w-80 sm:w-96 p-3.5 bg-[#141414]/95 text-white rounded-2xl border border-white/15 shadow-2xl backdrop-blur-xl animate-slideDown font-sans">
          <div className="flex items-center gap-3">
            {/* Thumbnail Preview Box */}
            <div className="w-12 h-14 rounded-xl overflow-hidden bg-black/80 shrink-0 relative border border-white/10 flex items-center justify-center">
              {uploadTask.previewUrl ? (
                uploadTask.previewUrl.startsWith("data:video") || uploadTask.previewUrl.includes("blob:") ? (
                  <video src={uploadTask.previewUrl} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={uploadTask.previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
                )
              ) : (
                <Film className="w-6 h-6 text-sky-400" />
              )}
              {uploadTask.state === "uploading" || uploadTask.state === "processing" ? (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              ) : null}
            </div>

            {/* Status & Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white truncate drop-shadow-sm">
                  {uploadTask.caption}
                </span>
                <span className="text-[11px] font-mono font-bold text-sky-400">
                  {uploadTask.progress}%
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium truncate mb-1.5 flex items-center gap-1">
                {uploadTask.state === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                {uploadTask.state === "error" && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                <span>{uploadTask.errorMsg || uploadTask.status}</span>
              </p>

              {/* Progress Bar Track */}
              <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 rounded-full ${
                    uploadTask.state === "completed"
                      ? "bg-emerald-400"
                      : uploadTask.state === "error"
                      ? "bg-rose-500"
                      : "bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400"
                  }`}
                  style={{ width: `${uploadTask.progress}%` }}
                />
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={dismissTask}
              className="text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    return {
      startUpload: () => console.warn("[UploadContext] Not wrapped in UploadProvider"),
      uploadTask: null,
      dismissTask: () => {}
    };
  }
  return context;
};
