import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateResidencyStatus, updateAvatarThunk, updateKycThunkUser } from "../store/authSlice";
import { userApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { PostCard } from "../components/PostCard";
import {
  Grid,
  List,
  Settings,
  Heart,
  MessageSquare,
  Eye,
  Award,
  Play,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Sparkles,
  Mail,
  FileCheck,
  Upload,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";

export const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("grid"); // "grid" | "feed" | "settings" | "kyc"
  const [myPosts, setMyPosts] = useState([]);
  const [stats, setStats] = useState({ totalPosts: 0, totalLikes: 0, totalComments: 0, totalViews: 0 });
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  const [residency, setResidency] = useState(user?.residency || "Other");
  const [updatingResidency, setUpdatingResidency] = useState(false);

  // KYC Form state
  const kycData = user?.kycDetails || {};
  const [aadharNumber, setAadharNumber] = useState(kycData.aadharNumber || "");
  const [aadharMobile, setAadharMobile] = useState(kycData.aadharMobile || "");
  const [dob, setDob] = useState(kycData.dob || "");
  const [aadharImageFile, setAadharImageFile] = useState(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [isKycDragging, setIsKycDragging] = useState(false);
  const [kycErrors, setKycErrors] = useState({});
  const kycFileInputRef = useRef(null);

  // Prevent browser default behavior of opening dropped files in a new tab
  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserPosts();
    }
  }, [user]);

  useEffect(() => {
    if (user?.kycDetails) {
      setAadharNumber(user.kycDetails.aadharNumber || "");
      setAadharMobile(user.kycDetails.aadharMobile || "");
      setDob(user.kycDetails.dob || "");
    }
  }, [user?.kycDetails]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedPost(null);
    };
    if (selectedPost) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPost]);

  const fetchUserPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await userApi.get("/posts/my-posts");
      setMyPosts(res.data.data.posts);
      setStats(res.data.data.stats);
    } catch (err) {
      console.error("Failed to fetch user posts", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 text-center ig-card p-8 rounded-3xl">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Please Login</h2>
        <p className="text-xs text-[var(--text-secondary)]">You need to log in to view your profile.</p>
      </div>
    );
  }

  const isCG = user.residency === "Chhattisgarh";
  const kycStatus = kycData.status || "NOT_SUBMITTED";

  const handleResidencyUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdatingResidency(true);
      await dispatch(updateResidencyStatus(residency)).unwrap();
      toast.success("Residency status updated successfully!", "Profile Updated");
    } catch (err) {
      toast.error("Failed to update residency", "Error");
    } finally {
      setUpdatingResidency(false);
    }
  };

  const handleAadharInputChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setAadharNumber(formatted);
    if (kycErrors.aadharNumber) {
      setKycErrors((prev) => ({ ...prev, aadharNumber: "" }));
    }
  };

  const handleMobileInputChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setAadharMobile(raw);
    if (kycErrors.aadharMobile) {
      setKycErrors((prev) => ({ ...prev, aadharMobile: "" }));
    }
  };

  const handleDobInputChange = (e) => {
    setDob(e.target.value);
    if (kycErrors.dob) {
      setKycErrors((prev) => ({ ...prev, dob: "" }));
    }
  };

  const validateKycForm = () => {
    const errors = {};
    const cleanAadhaar = aadharNumber.replace(/\D/g, "");
    if (!cleanAadhaar) {
      errors.aadharNumber = "Aadhaar Card Number is required.";
    } else if (cleanAadhaar.length !== 12) {
      errors.aadharNumber = `Aadhaar Number must be 12 digits (currently ${cleanAadhaar.length}/12).`;
    }

    const cleanMobile = aadharMobile.replace(/\D/g, "");
    if (!cleanMobile) {
      errors.aadharMobile = "Aadhaar attached Mobile Number is required.";
    } else if (cleanMobile.length !== 10) {
      errors.aadharMobile = `Mobile Number must be exactly 10 digits (currently ${cleanMobile.length}/10).`;
    } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      errors.aadharMobile = "Mobile Number must start with 6, 7, 8, or 9.";
    }

    if (!dob) {
      errors.dob = "Date of Birth is required.";
    } else {
      const dobDate = new Date(dob);
      const now = new Date();
      if (isNaN(dobDate.getTime())) {
        errors.dob = "Please select a valid date.";
      } else if (dobDate > now) {
        errors.dob = "Date of Birth cannot be in the future.";
      } else {
        let age = now.getFullYear() - dobDate.getFullYear();
        const m = now.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dobDate.getDate())) {
          age--;
        }
        if (age < 18) {
          errors.dob = `You must be at least 18 years old (Current age: ${age}).`;
        }
      }
    }

    if (!kycData.aadharImage && !aadharImageFile) {
      errors.aadharImage = "Aadhaar document image photo is required.";
    } else if (aadharImageFile) {
      if (aadharImageFile.size > 10 * 1024 * 1024) {
        errors.aadharImage = "File size exceeds 10MB limit. Please choose a smaller image.";
      } else if (!aadharImageFile.type.startsWith("image/")) {
        errors.aadharImage = "Invalid file type. Only JPEG, PNG, WEBP images allowed.";
      }
    }

    return errors;
  };

  const handleKycDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsKycDragging(true);
  };

  const handleKycDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsKycDragging(false);
  };

  const handleKycDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsKycDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (!droppedFile.type.startsWith("image/")) {
        toast.error("Please drop a valid image file (JPEG, PNG, WEBP)", "Invalid File");
        return;
      }
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit", "File Too Large");
        return;
      }
      setAadharImageFile(droppedFile);
      if (kycErrors.aadharImage) {
        setKycErrors((prev) => ({ ...prev, aadharImage: "" }));
      }
      toast.success(`Attached ${droppedFile.name}`, "File Attached");
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    const errors = validateKycForm();
    setKycErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError, "Validation Error");
      return;
    }

    try {
      setSubmittingKyc(true);
      const formData = new FormData();
      formData.append("aadharNumber", aadharNumber.replace(/\D/g, "").replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3"));
      formData.append("aadharMobile", aadharMobile);
      formData.append("dob", dob);
      if (aadharImageFile) {
        formData.append("aadharImage", aadharImageFile);
      }
      await dispatch(updateKycThunkUser(formData)).unwrap();
      toast.success("KYC documents uploaded & submitted for verification!", "KYC Submitted");
      setKycErrors({});
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to submit KYC details", "Error");
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await dispatch(updateAvatarThunk(formData)).unwrap();
      toast.success("Profile picture updated successfully!", "Photo Updated");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update profile picture", "Error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Instagram Header Profile Box */}
      <div className="ig-card p-6 sm:p-8 rounded-3xl shadow-lg mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative group cursor-pointer">
            <label className="cursor-pointer block relative">
              <input type="file" accept="image/*" onChange={handleAvatarFileSelect} className="hidden" />
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 ig-ring shadow-xl overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl.startsWith("http") ? user.avatarUrl : `http://localhost:5001${user.avatarUrl}`}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[var(--bg-main)] flex items-center justify-center font-black text-3xl sm:text-4xl text-[var(--text-primary)]">
                    {user.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-sky-500 text-white p-2 rounded-full border-2 border-[var(--bg-main)] shadow-md group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
            </label>
          </div>

          {/* User Details & Bio */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <h1 className="text-2xl font-black text-[var(--text-primary)]">{user.name}</h1>
              {kycStatus === "PASSED" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> KYC Verified
                </span>
              )}
            </div>

            <p className="text-xs text-[var(--text-secondary)] flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>{user.email}</span>
            </p>

            {/* Instagram Profile Stats Bar */}
            <div className="flex items-center justify-center sm:justify-start gap-6 pt-2 border-t border-[var(--border-main)]">
              <div className="text-center sm:text-left">
                <span className="block font-black text-[var(--text-primary)] text-base">{stats.totalPosts}</span>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Posts</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block font-black text-rose-500 text-base">{stats.totalLikes}</span>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Likes</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block font-black text-sky-500 text-base">{stats.totalComments}</span>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Comments</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block font-black text-emerald-500 text-base">{stats.totalViews}</span>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instagram Navigation Tabs Bar */}
      <div className="flex items-center justify-center border-b border-[var(--border-main)] mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("grid")}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs border-b-2 transition-all ${
            activeTab === "grid"
              ? "border-sky-500 text-sky-500 bg-sky-500/5"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>GRID GALLERY ({myPosts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("feed")}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs border-b-2 transition-all ${
            activeTab === "feed"
              ? "border-sky-500 text-sky-500 bg-sky-500/5"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <List className="w-4 h-4" />
          <span>REELS STREAM</span>
        </button>

        <button
          onClick={() => setActiveTab("kyc")}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs border-b-2 transition-all ${
            activeTab === "kyc"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>KYC VERIFICATION</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs border-b-2 transition-all ${
            activeTab === "settings"
              ? "border-sky-500 text-sky-500 bg-sky-500/5"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>RESIDENCY SETTINGS</span>
        </button>
      </div>

      {/* TAB 1: INSTAGRAM 3-COLUMN THUMBNAIL GRID */}
      {activeTab === "grid" && (
        <div>
          {loadingPosts ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="aspect-square bg-slate-500/10 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : myPosts.length === 0 ? (
            <div className="ig-card p-12 rounded-3xl text-center border border-[var(--border-main)]">
              <Sparkles className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">No Posts Yet</h3>
              <p className="text-xs text-[var(--text-secondary)]">Share your first video reel or image post to see it on your grid!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {myPosts.map((post) => {
                const mediaSource = post.mediaUrl.startsWith("http")
                  ? post.mediaUrl
                  : `http://localhost:5001${post.mediaUrl}`;

                return (
                  <div
                    key={post._id}
                    onClick={() => setSelectedPost(post)}
                    className="relative aspect-square bg-[var(--bg-main)] rounded-xl overflow-hidden cursor-pointer group border border-[var(--border-main)] hover:border-sky-500/50 transition-all shadow-sm"
                  >
                    {post.mediaType === "video" ? (
                      <video src={mediaSource} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={mediaSource} alt={post.caption} className="w-full h-full object-cover" />
                    )}

                    {post.mediaType === "video" && (
                      <div className="absolute top-2 right-2 p-1 rounded-md bg-black/70 text-white backdrop-blur-md">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white font-extrabold text-sm transition-opacity duration-200 backdrop-blur-[2px]">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-5 h-5 fill-white text-white" />
                        <span>{post.likeCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-5 h-5 fill-white text-white" />
                        <span>{post.commentCount || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REELS STREAM VIEW */}
      {activeTab === "feed" && (
        <div className="space-y-6 max-w-2xl mx-auto">
          {myPosts.length === 0 ? (
            <div className="ig-card p-12 rounded-3xl text-center border border-[var(--border-main)]">
              <p className="text-xs text-[var(--text-secondary)]">You haven't posted any reels yet.</p>
            </div>
          ) : (
            myPosts.map((post) => <PostCard key={post._id} post={post} />)
          )}
        </div>
      )}

      {/* TAB 3: KYC VERIFICATION UPLOAD FORM */}
      {activeTab === "kyc" && (
        <div className="ig-card p-8 rounded-3xl max-w-xl mx-auto space-y-6 border border-[var(--border-main)]">
          {/* Status Banner */}
          <div className="p-4 rounded-2xl border flex items-start gap-3 bg-slate-500/5 border-[var(--border-main)]">
            {kycStatus === "PASSED" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : kycStatus === "FAILED" ? (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : kycStatus === "PENDING" ? (
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <FileCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                KYC Status:{" "}
                <span className={
                  kycStatus === "PASSED" ? "text-emerald-400" :
                  kycStatus === "FAILED" ? "text-rose-400" :
                  kycStatus === "PENDING" ? "text-amber-400" : "text-[var(--text-muted)]"
                }>
                  {kycStatus === "PASSED" ? "Verified & Approved ✅" :
                   kycStatus === "FAILED" ? "Rejected ❌" :
                   kycStatus === "PENDING" ? "Under Verification ⏳" : "Not Submitted"}
                </span>
              </h3>
              <p className="text-xs mt-1 text-[var(--text-secondary)] leading-relaxed">
                Upload your Aadhaar details and card image. Admin verifies these details before awarding contest prizes.
              </p>
              {kycData.rejectionReason && kycStatus === "FAILED" && (
                <div className="mt-2 text-xs text-rose-400 font-semibold">
                  Reason: {kycData.rejectionReason}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleKycSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Aadhaar Card Number (12 Digits)
              </label>
              <input
                type="text"
                placeholder="e.g. 1234 5678 9012"
                value={aadharNumber}
                onChange={handleAadharInputChange}
                className={`w-full bg-[var(--bg-main)] border rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] font-mono focus:outline-none transition-colors ${
                  kycErrors.aadharNumber
                    ? "border-rose-500/80 bg-rose-500/5 focus:border-rose-500"
                    : "border-[var(--border-main)] focus:border-emerald-500"
                }`}
              />
              {kycErrors.aadharNumber && (
                <p className="text-[11px] text-rose-400 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{kycErrors.aadharNumber}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Aadhaar Attached Mobile Number (10 Digits)
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                maxLength={10}
                value={aadharMobile}
                onChange={handleMobileInputChange}
                className={`w-full bg-[var(--bg-main)] border rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] font-mono focus:outline-none transition-colors ${
                  kycErrors.aadharMobile
                    ? "border-rose-500/80 bg-rose-500/5 focus:border-rose-500"
                    : "border-[var(--border-main)] focus:border-emerald-500"
                }`}
              />
              {kycErrors.aadharMobile && (
                <p className="text-[11px] text-rose-400 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{kycErrors.aadharMobile}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Date of Birth (DOB)
              </label>
              <input
                type="date"
                value={dob}
                onChange={handleDobInputChange}
                className={`w-full bg-[var(--bg-main)] border rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] focus:outline-none transition-colors ${
                  kycErrors.dob
                    ? "border-rose-500/80 bg-rose-500/5 focus:border-rose-500"
                    : "border-[var(--border-main)] focus:border-emerald-500"
                }`}
              />
              {kycErrors.dob && (
                <p className="text-[11px] text-rose-400 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{kycErrors.dob}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Aadhaar Card Photo / Document Image
              </label>
              <div
                onDragEnter={handleKycDragOver}
                onDragOver={handleKycDragOver}
                onDragLeave={handleKycDragLeave}
                onDrop={handleKycDrop}
                onClick={() => kycFileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  kycErrors.aadharImage
                    ? "border-rose-500/80 bg-rose-500/5"
                    : isKycDragging
                    ? "border-emerald-500 bg-emerald-500/15 scale-[1.01]"
                    : "border-[var(--border-main)] hover:border-emerald-500 bg-slate-500/5 hover:bg-slate-500/10"
                }`}
              >
                <input
                  type="file"
                  ref={kycFileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const selected = e.target.files[0];
                      if (!selected.type.startsWith("image/")) {
                        toast.error("Please select a valid image file", "Invalid File");
                        return;
                      }
                      if (selected.size > 10 * 1024 * 1024) {
                        toast.error("File size exceeds 10MB limit", "File Too Large");
                        return;
                      }
                      setAadharImageFile(selected);
                      if (kycErrors.aadharImage) {
                        setKycErrors((prev) => ({ ...prev, aadharImage: "" }));
                      }
                      toast.success(`Attached ${selected.name}`, "File Selected");
                    }
                  }}
                  className="hidden"
                />
                <Upload className={`w-8 h-8 mx-auto mb-2 transition-transform pointer-events-none ${isKycDragging ? "text-emerald-400 scale-110" : kycErrors.aadharImage ? "text-rose-400" : "text-emerald-500"}`} />
                <p className="text-xs font-semibold text-[var(--text-primary)] pointer-events-none">
                  {isKycDragging
                    ? "Drop Aadhaar image here"
                    : aadharImageFile
                    ? aadharImageFile.name
                    : kycData.aadharImage
                    ? "Change Aadhaar Image"
                    : "Click or Drag Aadhaar Card Image"}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1 pointer-events-none">
                  JPEG, PNG, WEBP up to 10MB
                </p>
              </div>

              {kycErrors.aadharImage && (
                <p className="text-[11px] text-rose-400 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{kycErrors.aadharImage}</span>
                </p>
              )}

              {kycData.aadharImage && !aadharImageFile && !kycErrors.aadharImage && (
                <div className="mt-2 text-xs text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded Image on file
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submittingKyc}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>{submittingKyc ? "Submitting..." : "Submit KYC Verification"}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: RESIDENCY SETTINGS */}
      {activeTab === "settings" && (
        <div className="ig-card p-8 rounded-3xl max-w-xl mx-auto space-y-6">
          <div
            className={`p-4 rounded-2xl border ${
              isCG
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                : "bg-amber-500/10 border-amber-500/30 text-amber-500"
            }`}
          >
            <div className="flex items-start gap-3">
              {isCG ? (
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="font-bold text-sm">
                  {isCG ? "Eligible for Creator Contest Prizes!" : "Ineligible for Creator Contest Prizes"}
                </h3>
                <p className="text-xs mt-1 leading-relaxed opacity-90">
                  {isCG
                    ? "Your residency is set to Chhattisgarh. Your posts enter the 33 Prize Tiers ranking engine!"
                    : "Only Chhattisgarh residents are eligible for winner prizes."}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleResidencyUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-500" />
                <span>State Residency</span>
              </label>
              <select
                value={residency}
                onChange={(e) => setResidency(e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-sky-500"
              >
                <option value="Chhattisgarh">Chhattisgarh</option>
                <option value="Delhi">Delhi</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Other State">Other State</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={updatingResidency}
              className="w-full py-3 ig-btn-primary disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{updatingResidency ? "Saving..." : "Save Residency Changes"}</span>
            </button>
          </form>
        </div>
      )}

      {/* POST PREVIEW MODAL */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl animate-fadeIn no-scrollbar shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <PostCard
              post={selectedPost}
              inModal={true}
              onClose={() => setSelectedPost(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
