import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { signupUser, loginUser, clearAuthError } from "../store/authSlice";
import { Sparkles, ArrowRight, UserCheck, ShieldCheck, Camera, User, Trash2 } from "lucide-react";

export const AuthPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  // Default mode is 'signup' as requested
  const isSignupMode = searchParams.get("mode") !== "login";
  const { user, loading, error, signupSuccess, signupEmail } = useSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [residency, setResidency] = useState("Chhattisgarh");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
    dispatch(clearAuthError());
  }, [user, navigate, dispatch]);

  useEffect(() => {
    if (signupSuccess) {
      if (signupEmail) {
        setEmail(signupEmail);
      }
      setPassword("");
      setAvatarFile(null);
      setAvatarPreview(null);
      // Switch mode to login after successful signup
      setSearchParams({ mode: "login" });
    }
  }, [signupSuccess, signupEmail, setSearchParams]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignupMode) {
      if (avatarFile) {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("residency", residency);
        formData.append("avatar", avatarFile);
        dispatch(signupUser(formData));
      } else {
        dispatch(signupUser({ name, email, password, residency }));
      }
    } else {
      dispatch(loginUser({ email, password }));
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="ig-card w-full max-w-md p-8 rounded-3xl shadow-xl relative">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">
            {isSignupMode ? "Create an Account" : "Welcome Back"}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isSignupMode
              ? "Join the Creator Contest Platform"
              : "Login to view feed and enter contests"}
          </p>
        </div>

        {signupSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs text-center font-semibold animate-fadeIn flex items-center justify-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span>🎉 Account created successfully! Please log in to continue.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignupMode && (
            <>
              {/* Circular Avatar Placeholder Logo */}
              <div className="flex flex-col items-center justify-center mb-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group cursor-pointer w-24 h-24 rounded-full border-2 border-dashed border-sky-500/50 hover:border-sky-400 bg-[var(--bg-main)] flex items-center justify-center transition-all shadow-md hover:shadow-sky-500/20"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      className="w-full h-full rounded-full object-cover border border-[var(--border-main)]"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[var(--text-secondary)] group-hover:text-sky-500 transition-colors">
                      <User className="w-10 h-10 stroke-[1.5]" />
                      <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md border-2 border-[var(--bg-card)]">
                        <Camera className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}

                  {/* Hover overlay text */}
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                    {avatarPreview ? "Change" : "Add Photo"}
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                <div className="mt-2 text-center">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    {avatarPreview ? "Profile Photo Selected" : "Add Profile Photo"}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {avatarPreview ? (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="text-rose-500 hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        <Trash2 className="w-3 h-3" /> Remove photo
                      </button>
                    ) : (
                      "Optional • Click logo to choose or skip"
                    )}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="creator@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500"
            />
          </div>

          {isSignupMode && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                State Residency
              </label>
              <select
                value={residency}
                onChange={(e) => setResidency(e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-sky-500"
              >
                <option value="Chhattisgarh">Chhattisgarh</option>
                <option value="Delhi">Delhi</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Other State">Other State</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 ig-btn-primary rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all mt-6"
          >
            <span>{loading ? "Processing..." : isSignupMode ? "Create Account" : "Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-[var(--text-secondary)]">
          {isSignupMode ? (
            <span>
              Already have an account?{" "}
              <button
                onClick={() => navigate("/auth?mode=login")}
                className="text-sky-500 font-bold hover:underline"
              >
                Login
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/auth?mode=signup")}
                className="text-sky-500 font-bold hover:underline"
              >
                Signup
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
