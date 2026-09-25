import React from "react";
import { useNavigate } from "react-router-dom";
import { X, Heart, MessageCircle, Eye, Calendar, Award, ShieldCheck, FileText, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { useDispatch } from "react-redux";
import { updateKycThunk } from "../store/adminSlice";
import { getMediaUrl } from "../config";

export const AdminWinnerModal = ({ winner, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!winner) return null;

  const post = winner.topPost;
  const kyc = winner.kycDetails || {};
  const usernameDisplay = winner.username || winner.userEmail?.split("@")[0] || (winner.userName ? winner.userName.toLowerCase().replace(/\s+/g, "_") : "unknown");

  const handleKycAction = (newStatus) => {
    dispatch(updateKycThunk({ winnerId: winner.userId || winner.userEmail, status: newStatus, notes: `KYC ${newStatus} from winner inspect modal` }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="ig-card w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-main)] bg-[var(--bg-card)]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-main)] flex items-center justify-between bg-slate-500/5">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[var(--text-primary)] text-sm">
                  {(winner.userName || "").replace(/\s*\([^)]*\)/g, "").trim()}
                </h3>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/profile/${usernameDisplay || winner.userId}`);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 hover:underline cursor-pointer"
                  title="Visit Profile"
                >
                  <span>@{usernameDisplay}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] font-mono">
                {winner.userEmail} • Prize: <span className="text-amber-400 font-bold">{winner.tier?.replace(/_/g, " ")}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-500/20 text-[var(--text-secondary)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Winner Profile Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-slate-500/10 border border-slate-500/20">
              <div className="text-[10px] text-[var(--text-muted)] font-medium">Priority Rank</div>
              <div className="text-lg font-black text-sky-500 font-mono">#{winner.priorityIndex}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-500/10 border border-slate-500/20">
              <div className="text-[10px] text-[var(--text-muted)] font-medium">Calculation Score</div>
              <div className="text-lg font-black text-amber-500">{winner.score || 0}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-500/10 border border-slate-500/20">
              <div className="text-[10px] text-[var(--text-muted)] font-medium">Residency State</div>
              <div className="text-xs font-bold text-emerald-400 mt-1">{winner.residency || winner.state || "Chhattisgarh"}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-500/10 border border-slate-500/20">
              <div className="text-[10px] text-[var(--text-muted)] font-medium">KYC Status</div>
              <div className={`text-xs font-bold mt-1 ${
                winner.kycStatus === "PASSED" ? "text-emerald-400" :
                winner.kycStatus === "FAILED" ? "text-rose-400" : "text-amber-400"
              }`}>
                {winner.kycStatus}
              </div>
            </div>
          </div>

          {/* User Submitted KYC Details Section */}
          <div className="p-4 rounded-2xl border border-[var(--border-main)] bg-slate-500/5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Submitted KYC Identification Documents
                </h4>
              </div>

              <div className="flex items-center gap-2">
                {winner.kycStatus !== "PASSED" && (
                  <button
                    onClick={() => handleKycAction("PASSED")}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-sm transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3 h-3" /> Approve KYC
                  </button>
                )}
                {winner.kycStatus !== "FAILED" && (
                  <button
                    onClick={() => handleKycAction("FAILED")}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] shadow-sm transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3 h-3" /> Reject & Cascade
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Aadhaar Card Number</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">
                  {kyc.aadharNumber || "Not Provided"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Aadhaar Mobile Number</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">
                  {kyc.aadharMobile || "Not Provided"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Date of Birth (DOB)</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">
                  {kyc.dob || "Not Provided"}
                </span>
              </div>
            </div>

            {/* Aadhaar Card Document Image */}
            {kyc.aadharImage ? (
              <div className="mt-2 space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] block">Uploaded Aadhaar Card Image:</span>
                <div className="relative aspect-video max-h-48 rounded-xl overflow-hidden border border-[var(--border-main)] bg-black">
                  <img
                    src={getMediaUrl(kyc.aadharImage)}
                    alt="Aadhaar Card Document"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] text-center">
                User has not uploaded Aadhaar Card image document yet.
              </div>
            )}
          </div>

          {/* Winning Post Details */}
          <div>
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Top Evaluation Post Preview
            </h4>

            {post ? (
              <div className="rounded-2xl border border-[var(--border-main)] overflow-hidden bg-slate-500/5">
                {/* Media Preview */}
                {post.mediaUrl && (
                  <div className="relative aspect-video max-h-72 bg-black flex items-center justify-center overflow-hidden">
                    {post.isVideo || post.mediaUrl.endsWith(".mp4") || post.mediaUrl.includes("/video/") ? (
                      <video
                        src={post.mediaUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt="Winning Post Media"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                )}

                {/* Caption & Stats */}
                <div className="p-4 space-y-3">
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                    {post.caption || "No caption provided."}
                  </p>

                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-main)]">
                    <div className="flex items-center gap-4 font-mono">
                      <span className="flex items-center gap-1 font-semibold text-rose-500">
                        <Heart className="w-4 h-4 fill-rose-500" /> {post.likesCount || 0}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-sky-400">
                        <MessageCircle className="w-4 h-4" /> {post.commentsCount || 0}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-indigo-400">
                        <Eye className="w-4 h-4" /> {post.viewsCount || 0}
                      </span>
                    </div>

                    {post.createdAt && (
                      <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] font-mono">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl bg-slate-500/10 border border-slate-500/20 text-xs text-[var(--text-muted)] italic">
                No single post attached to this prize tier (or default calculated winner).
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-main)] bg-slate-500/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-500/20 hover:bg-slate-500/30 text-[var(--text-primary)] font-bold text-xs transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
