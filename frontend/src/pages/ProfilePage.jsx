import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { updateResidencyStatus, updateAvatarThunk, deleteAvatarThunk, updateKycThunkUser, updateProfileThunk } from "../store/authSlice";
import { userApi } from "../services/api";
import { socket } from "../services/socket";
import { useToast } from "../context/ToastContext";
import { PostCard } from "../components/PostCard";
import { getMediaUrl } from "../config";
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
  Clock,
  Camera,
  Trash2,
  User,
  Ban
} from "lucide-react";

export const ProfilePage = () => {
  const dispatch = useDispatch();
  const { identifier, userId } = useParams();
  const rawIdentifier = identifier || userId;
  const profileIdentifier = rawIdentifier ? rawIdentifier.replace(/^@/, "").trim() : "";
  const { user: currentUser } = useSelector((state) => state.auth);
  const { toast } = useToast();

  const isOwnProfile =
    !profileIdentifier ||
    (currentUser &&
      (currentUser._id === profileIdentifier ||
        currentUser.id === profileIdentifier ||
        (currentUser.username && currentUser.username.toLowerCase() === profileIdentifier.toLowerCase()) ||
        (currentUser.email && currentUser.email.split("@")[0].toLowerCase() === profileIdentifier.toLowerCase())));

  const [activeTab, setActiveTab] = useState("grid"); // "grid" | "feed" | "settings" | "kyc"
  const [profileUser, setProfileUser] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [stats, setStats] = useState({ totalPosts: 0, totalLikes: 0, totalComments: 0, totalViews: 0 });
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  const [residency, setResidency] = useState(currentUser?.residency || "Other");
  const [updatingResidency, setUpdatingResidency] = useState(false);

  // KYC Form state
  const kycData = currentUser?.kycDetails || {};
  const [aadharNumber, setAadharNumber] = useState(kycData.aadharNumber || "");
  const [aadharMobile, setAadharMobile] = useState(kycData.aadharMobile || "");
  const [dob, setDob] = useState(kycData.dob || "");
  const [aadharImageFile, setAadharImageFile] = useState(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [isKycDragging, setIsKycDragging] = useState(false);
  const [kycErrors, setKycErrors] = useState({});
  const kycFileInputRef = useRef(null);

  // Profile edit state (bio + displayName)
  const [editDisplayName, setEditDisplayName] = useState(currentUser?.displayName || "");
  const [editBio, setEditBio] = useState(currentUser?.bio || "");
  const [savingProfile, setSavingProfile] = useState(false);

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
    fetchProfileData();
  }, [profileIdentifier, currentUser]);

  useEffect(() => {
    const handlePostCreated = () => {
      fetchProfileData();
    };
    window.addEventListener("post_created", handlePostCreated);
    return () => window.removeEventListener("post_created", handlePostCreated);
  }, [profileIdentifier, currentUser]);

  useEffect(() => {
    if (currentUser?.kycDetails) {
      setAadharNumber(currentUser.kycDetails.aadharNumber || "");
      setAadharMobile(currentUser.kycDetails.aadharMobile || "");
      setDob(currentUser.kycDetails.dob || "");
    }
  }, [currentUser?.kycDetails]);

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

  // Listen for real-time user updates (e.g. profile picture changes/deletions)
  useEffect(() => {
    const handleUserUpdated = (data) => {
      if (!data || !data.userId) return;

      setProfileUser((prev) => {
        if (!prev) return prev;
        if (prev._id === data.userId || prev.id === data.userId) {
          return { ...prev, avatarUrl: data.avatarUrl };
        }
        return prev;
      });

      setMyPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.userId && (post.userId._id === data.userId || post.userId.id === data.userId || post.userId === data.userId)) {
            if (typeof post.userId === "object") {
              return { ...post, userId: { ...post.userId, avatarUrl: data.avatarUrl } };
            }
          }
          return post;
        })
      );
    };

    socket.on("user_updated", handleUserUpdated);
    return () => {
      socket.off("user_updated", handleUserUpdated);
    };
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoadingPosts(true);
      if (!profileIdentifier || isOwnProfile) {
        setProfileUser(currentUser);
        const res = await userApi.get("/posts/my-posts");
        setMyPosts(res.data.data.posts || []);
        setStats(res.data.data.stats || { totalPosts: 0, totalLikes: 0, totalComments: 0, totalViews: 0 });
      } else {
        const res = await userApi.get(`/posts/user/${encodeURIComponent(profileIdentifier)}`);
        setProfileUser(res.data.data.user || null);
        setMyPosts(res.data.data.posts || []);
        setStats(res.data.data.stats || { totalPosts: 0, totalLikes: 0, totalComments: 0, totalViews: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch profile data", err);
      setProfileUser(null);
    } finally {
      setLoadingPosts(false);
    }
  };

  const displayUser = profileUser || (isOwnProfile ? currentUser : null);

  if (loadingPosts) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile header skeleton */}
        <div className="flex items-center gap-6 p-6 rounded-3xl bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-[#272727]">
          <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-[#1f1f1f] shrink-0 shimmer-effect" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-40 rounded-full bg-slate-200 dark:bg-[#1f1f1f] shimmer-effect" />
            <div className="h-3 w-28 rounded-full bg-slate-200 dark:bg-[#1f1f1f] shimmer-effect" />
            <div className="h-3 w-48 rounded-full bg-slate-200 dark:bg-[#1f1f1f] shimmer-effect" />
          </div>
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-2xl bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-[#272727] p-4 space-y-2">
              <div className="h-5 w-12 rounded-full bg-slate-200 dark:bg-[#1f1f1f] shimmer-effect mx-auto" />
              <div className="h-3 w-16 rounded-full bg-slate-200 dark:bg-[#1f1f1f] shimmer-effect mx-auto" />
            </div>
          ))}
        </div>
        {/* Posts grid skeleton */}
        <div className="grid grid-cols-3 gap-1.5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-[9/16] rounded-xl bg-slate-200 dark:bg-[#1f1f1f] shimmer-effect" />
          ))}
        </div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="max-w-md mx-auto my-12 text-center ig-card p-8 rounded-3xl">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">User Not Found</h2>
        <p className="text-xs text-[var(--text-secondary)]">The requested creator profile does not exist or has been removed.</p>
      </div>
    );
  }

  if (displayUser.isBanned) {
    return (
      <div className="max-w-md mx-auto my-16 text-center ig-card p-8 rounded-3xl border border-rose-500/30 bg-rose-500/5 space-y-4 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center mx-auto border border-rose-500/40">
          <Ban className="w-8 h-8 text-rose-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-rose-400">Account Suspended</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
            This account (@{displayUser.username || displayUser.name}) has been banned by administrators for violating platform rules.
          </p>
          {displayUser.banReason && (
            <div className="mt-3 p-3 rounded-xl bg-slate-500/10 border border-[var(--border-main)] text-[11px] font-mono text-[var(--text-muted)]">
              Reason: "{displayUser.banReason}"
            </div>
          )}
        </div>
      </div>
    );
  }

  const isCG = displayUser?.residency === "Chhattisgarh";
  const kycStatus = displayUser?.kycDetails?.status || (isOwnProfile ? kycData.status : "NOT_SUBMITTED");

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

  const handleAvatarDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove your profile picture?")) return;
    try {
      await dispatch(deleteAvatarThunk()).unwrap();
      toast.success("Profile picture removed successfully!", "Photo Removed");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to remove profile picture", "Error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2.5 sm:px-4 py-4 sm:py-8">
      {/* Instagram Header Profile Box */}
      <div className="ig-card p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          {/* Avatar Container with Upload & Delete Actions */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1 ig-ring shadow-xl overflow-hidden relative">
              {displayUser.avatarUrl ? (
                <img
                  src={getMediaUrl(displayUser.avatarUrl)}
                  alt={displayUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-[var(--bg-main)] flex items-center justify-center font-bold text-xl sm:text-3xl text-[var(--text-primary)]">
                  {displayUser.name ? displayUser.name[0].toUpperCase() : "U"}
                </div>
              )}
            </div>

            {/* Quick Action Badges for Own Profile */}
            {isOwnProfile && (
              <div className="absolute -bottom-1 -right-1 flex items-center gap-1.5 z-10">
                {/* Upload / Change Photo */}
                <label
                  title="Upload / Change Profile Picture"
                  className="bg-sky-500 hover:bg-sky-600 text-white p-1.5 sm:p-2 rounded-full border-2 border-[var(--bg-card)] shadow-md cursor-pointer transition-all hover:scale-110 flex items-center justify-center"
                >
                  <input type="file" accept="image/*" onChange={handleAvatarFileSelect} className="hidden" />
                  <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </label>

                {/* Delete Photo */}
                {displayUser.avatarUrl && (
                  <button
                    onClick={handleAvatarDelete}
                    title="Remove Profile Picture"
                    className="bg-rose-500 hover:bg-rose-600 text-white p-1.5 sm:p-2 rounded-full border-2 border-[var(--bg-card)] shadow-md cursor-pointer transition-all hover:scale-110 flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User Details & Bio */}
          <div className="flex-1 w-full text-center sm:text-left space-y-2.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                {displayUser.displayName || (displayUser.name || "").replace(/\s*\([^)]*\)/g, "").trim()}
              </h1>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                @{displayUser.username || displayUser.name?.toLowerCase().replace(/\s+/g, "_")}
              </span>
              {kycStatus === "PASSED" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> KYC Verified
                </span>
              )}
              {isCG && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#272727] dark:text-slate-300 dark:border-[#3f3f3f]">
                  <MapPin className="w-3 h-3 text-slate-500 dark:text-slate-400" /> Chhattisgarh Resident
                </span>
              )}
            </div>

            {(isOwnProfile || currentUser?.role === "admin") && displayUser.email && (
              <p className="text-xs text-[var(--text-secondary)] flex items-center justify-center sm:justify-start gap-1.5 font-medium truncate">
                <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                <span className="truncate">{displayUser.email}</span>
              </p>
            )}

            {/* Bio Display */}
            {displayUser.bio && (
              <p className="text-xs text-[var(--text-primary)] leading-relaxed text-center sm:text-left max-w-xs sm:max-w-sm">
                {displayUser.bio}
              </p>
            )}

            {/* Instagram Profile Stats Bar */}
            <div className="grid grid-cols-3 sm:flex sm:items-center sm:justify-start gap-3 sm:gap-7 pt-3 mt-3 border-t border-[var(--border-main)]">
              <div className="text-center sm:text-left">
                <span className="block font-bold text-[var(--text-primary)] text-sm sm:text-base tracking-tight">{stats.totalPosts || 0}</span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Posts</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block font-bold text-[var(--text-primary)] text-sm sm:text-base tracking-tight">{stats.followers ?? displayUser?.followers ?? 0}</span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Followers</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block font-bold text-[var(--text-primary)] text-sm sm:text-base tracking-tight">{stats.following ?? displayUser?.following ?? 0}</span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Following</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block font-bold text-rose-500 text-sm sm:text-base tracking-tight">{stats.totalLikes || 0}</span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Likes</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block font-bold text-sky-500 text-sm sm:text-base tracking-tight">{stats.totalComments || 0}</span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Comments</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block font-bold text-emerald-500 text-sm sm:text-base tracking-tight">{stats.totalViews || 0}</span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instagram Navigation Tabs Bar */}
      <div className="flex items-center justify-start sm:justify-center border-b border-[var(--border-main)] mb-6 overflow-x-auto no-scrollbar flex-nowrap gap-1 sm:gap-2 px-1">
        <button
          onClick={() => setActiveTab("grid")}
          className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2.5 sm:py-3 font-bold text-[11px] sm:text-xs border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === "grid"
              ? "border-sky-500 text-sky-500 bg-sky-500/5"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Grid className="w-4 h-4 shrink-0" />
          <span>GRID ({myPosts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("feed")}
          className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2.5 sm:py-3 font-bold text-[11px] sm:text-xs border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === "feed"
              ? "border-sky-500 text-sky-500 bg-sky-500/5"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <List className="w-4 h-4 shrink-0" />
          <span>REELS STREAM</span>
        </button>

        {isOwnProfile && (
          <button
            onClick={() => setActiveTab("kyc")}
            className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2.5 sm:py-3 font-bold text-[11px] sm:text-xs border-b-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === "kyc"
                ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>KYC VERIFICATION</span>
          </button>
        )}

        {isOwnProfile && (
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2.5 sm:py-3 font-bold text-[11px] sm:text-xs border-b-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === "settings"
                ? "border-sky-500 text-sky-500 bg-sky-500/5"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>EDIT PROFILE</span>
          </button>
        )}
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
                const mediaSource = getMediaUrl(post.mediaUrl);
                const coverSource = post.thumbnailUrl ? getMediaUrl(post.thumbnailUrl) : null;

                const isVideo =
                  post.mediaType === "video" ||
                  post.isVideo ||
                  Boolean(post.mediaUrl && post.mediaUrl.match(/\.(mp4|mov|webm|mkv|avi|m3u8)($|\?)/i)) ||
                  Boolean(post.mediaUrl && post.mediaUrl.includes("/video/upload/")) ||
                  Boolean(post.mediaUrl && post.mediaUrl.includes("/creator-contest-reels/"));

                return (
                  <div
                    key={post._id}
                    onClick={() => setSelectedPost(post)}
                    className="relative aspect-square bg-[var(--bg-main)] rounded-xl overflow-hidden cursor-pointer group border border-[var(--border-main)] hover:border-sky-500/50 transition-all shadow-sm"
                  >
                    {isVideo ? (
                      coverSource ? (
                        <img src={coverSource} alt={post.caption} className="w-full h-full object-cover" />
                      ) : (
                        <video src={mediaSource} className="w-full h-full object-cover" muted />
                      )
                    ) : (
                      <img src={mediaSource} alt={post.caption} className="w-full h-full object-cover" />
                    )}

                    {isVideo && (
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

      {/* TAB 4: EDIT PROFILE SETTINGS */}
      {activeTab === "settings" && (
        <div className="space-y-5 max-w-xl mx-auto">

          {/* === SECTION 1: Profile Info (displayName + bio) === */}
          <div className="ig-card p-6 sm:p-8 rounded-3xl border border-[var(--border-main)] space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-main)]">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 flex items-center justify-center">
                <User className="w-4 h-4 text-sky-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Public Profile Info</h3>
                <p className="text-[10px] text-[var(--text-muted)]">Visible to everyone on your creator profile</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Display Name <span className="text-[10px] font-normal text-[var(--text-muted)]">(optional — shown instead of your real name)</span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder={currentUser?.name || "Enter a display name..."}
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-sky-500 transition-colors placeholder-[var(--text-muted)]"
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1 text-right">{editDisplayName.length}/50</p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Bio <span className="text-[10px] font-normal text-[var(--text-muted)]">(share your story — max 150 chars)</span>
                </label>
                <textarea
                  maxLength={150}
                  rows={3}
                  placeholder="Creator | Chhattisgarh 🇮🇳 | Content is my passion..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-sky-500 transition-colors resize-none placeholder-[var(--text-muted)] leading-relaxed"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {editBio.length > 0 ? `${150 - editBio.length} characters remaining` : "Tell your audience about yourself"}
                  </p>
                  <p className={`text-[10px] font-bold ${
                    editBio.length > 130 ? "text-amber-400" : "text-[var(--text-muted)]"
                  }`}>{editBio.length}/150</p>
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    setSavingProfile(true);
                    await dispatch(updateProfileThunk({ displayName: editDisplayName, bio: editBio })).unwrap();
                    toast.success("Profile updated successfully!", "Profile Saved");
                  } catch (err) {
                    toast.error(typeof err === "string" ? err : "Failed to update profile", "Error");
                  } finally {
                    setSavingProfile(false);
                  }
                }}
                disabled={savingProfile}
                className="w-full py-3 ig-btn-primary disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
              >
                <Sparkles className="w-4 h-4" />
                <span>{savingProfile ? "Saving..." : "Save Profile Changes"}</span>
              </button>
            </div>
          </div>

          {/* === SECTION 2: Residency (Contest Eligibility) === */}
          <div className="ig-card p-6 sm:p-8 rounded-3xl border border-[var(--border-main)] space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-main)]">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isCG ? "bg-emerald-500/15" : "bg-amber-500/15"
              }`}>
                <MapPin className={`w-4 h-4 ${isCG ? "text-emerald-500" : "text-amber-500"}`} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Contest Residency</h3>
                <p className="text-[10px] text-[var(--text-muted)]">Determines your contest prize eligibility</p>
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isCG
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-500"
              }`}
            >
              {isCG ? (
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="font-bold text-xs">
                  {isCG ? "Eligible for Creator Contest Prizes!" : "Ineligible for Creator Contest Prizes"}
                </h3>
                <p className="text-[10px] mt-1 leading-relaxed opacity-90">
                  {isCG
                    ? "Your residency is set to Chhattisgarh. Your posts enter the 33 Prize Tiers ranking engine!"
                    : "Only Chhattisgarh residents are eligible for winner prizes."}
                </p>
              </div>
            </div>

            <form onSubmit={handleResidencyUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-500" />
                  <span>State of Residency</span>
                </label>
                <select
                  value={residency}
                  onChange={(e) => setResidency(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-sky-500"
                >
                  <option value="Chhattisgarh">Chhattisgarh ✅ (Prize Eligible)</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Other State">Other State</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={updatingResidency}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                <span>{updatingResidency ? "Saving..." : "Save Residency"}</span>
              </button>
            </form>
          </div>
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
