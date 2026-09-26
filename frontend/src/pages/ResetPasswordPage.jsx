import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { userApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Lock, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token.", "Error");
      navigate("/auth?mode=login");
    }
  }, [token, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.warning("Please fill out all fields", "Missing Data");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match", "Error");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long", "Error");
      return;
    }

    setLoading(true);
    try {
      await userApi.post("/auth/reset-password", { token, password });
      toast.success("Password updated successfully! You can now log in.", "Success");
      setTimeout(() => {
        navigate("/auth?mode=login");
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password. Link may be expired.", "Error");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md ig-card rounded-[2rem] p-8 sm:p-10 text-center relative overflow-hidden">
        
        {/* Background Decorative Blur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none" />

        <div className="w-16 h-16 bg-[var(--bg-main)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-[var(--border-main)] relative z-10">
          <ShieldCheck className="w-8 h-8 text-emerald-500" />
        </div>

        <h1 className="text-2xl font-black mb-2 text-[var(--text-primary)]">Set New Password</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium mb-8 max-w-[280px] mx-auto leading-relaxed">
          Create a new strong password for your Contestify account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10 text-left">
          {/* New Password */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5 pl-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl pl-10 pr-12 py-3.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors font-medium"
              />
              <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5 pl-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl pl-10 pr-4 py-3.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors font-medium"
              />
              <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Password...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
