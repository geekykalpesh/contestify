import React, { useState } from "react";
import { Link } from "react-router-dom";
import { userApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Mail, ArrowLeft, Loader2, KeyRound } from "lucide-react";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.warning("Please enter your email", "Missing Email");
      return;
    }
    
    setLoading(true);
    setFallbackUrl("");
    try {
      const res = await userApi.post("/auth/forgot-password", { email });
      setSuccess(true);
      
      if (res.data.resetUrl) {
        toast.error("Host blocked email sending. Please use the fallback link below.", "Email Blocked");
        setFallbackUrl(res.data.resetUrl);
        setFallbackMessage(res.data.message || "Emails blocked by Render Free Tier.");
      } else {
        toast.success("Password reset link sent to your email!", "Email Sent");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset link", "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md ig-card rounded-[2rem] p-8 sm:p-10 text-center relative overflow-hidden">
        
        {/* Background Decorative Blur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-sky-500/20 rounded-full blur-[60px] pointer-events-none" />

        <div className="w-16 h-16 bg-[var(--bg-main)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-[var(--border-main)] relative z-10">
          <KeyRound className="w-8 h-8 text-sky-500" />
        </div>

        <h1 className="text-2xl font-black mb-2 text-[var(--text-primary)]">Forgot Password?</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium mb-8 max-w-[280px] mx-auto leading-relaxed">
          {success 
            ? "Check your inbox (and spam folder) for the password reset link."
            : "No worries! Enter your email and we'll send you a link to reset your password."}
        </p>

        {success ? (
          <div className="space-y-4 relative z-10">
            {fallbackUrl ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center flex flex-col items-center gap-3">
                <span className="text-amber-500 text-[10px] font-bold leading-relaxed">{fallbackMessage}</span>
                <a href={fallbackUrl} className="px-4 py-2 bg-sky-500 text-white text-xs font-bold rounded-xl hover:bg-sky-600 shadow-md w-full">
                  Click here to Reset Password
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                <span>Reset link sent to {email}</span>
              </div>
            )}
            <Link to="/auth?mode=login" className="block w-full text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              Return to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10 text-left">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5 pl-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl pl-10 pr-4 py-3.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-sky-500 transition-colors placeholder-[var(--text-muted)] font-medium"
                />
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Link...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>

            <Link to="/auth?mode=login" className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mt-6 mx-auto w-fit">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};
