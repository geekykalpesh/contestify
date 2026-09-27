import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { signupUser, loginUser, clearAuthError } from "../store/authSlice";
import { userApi } from "../services/api";
import {
  Sparkles,
  UserCheck,
  Camera,
  User,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  Infinity,
  HelpCircle,
  Heart,
  MessageCircle,
  Bookmark
} from "lucide-react";

const MONTHS = [
  "Month",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const currentYear = new Date().getFullYear();
const YEARS = ["Year", ...Array.from({ length: 100 }, (_, i) => String(currentYear - i))];

export const AuthPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  // Default mode is 'login' (changed from signup)
  const isSignupMode = searchParams.get("mode") === "signup";
  const { user, loading, error, signupSuccess, signupEmail } = useSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [residency, setResidency] = useState("Chhattisgarh");
  
  // Birthday Dropdowns state
  const [birthMonth, setBirthMonth] = useState("August");
  const [birthDay, setBirthDay] = useState("15");
  const [birthYear, setBirthYear] = useState("1997");

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Instant Availability Check States (Instagram Style)
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null); // null | true | false
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(null); // null | true | false

  useEffect(() => {
    if (user) {
      navigate("/");
    }
    dispatch(clearAuthError());
  }, [user, navigate, dispatch]);

  useEffect(() => {
    if (signupSuccess) {
      if (signupEmail) {
        setLoginIdentifier(signupEmail);
      }
      setPassword("");
      setAvatarFile(null);
      setAvatarPreview(null);
      // Switch mode to login after successful signup
      setSearchParams({ mode: "login" });
    }
  }, [signupSuccess, signupEmail, setSearchParams]);

  // Debounced Instagram-style Username Uniqueness Live Check
  useEffect(() => {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!isSignupMode || !cleanUsername || cleanUsername.length < 3) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const res = await userApi.get(`/auth/check-availability?username=${encodeURIComponent(cleanUsername)}`);
        if (res.data?.success) {
          setUsernameAvailable(res.data.data.usernameAvailable);
        }
      } catch (err) {
        console.error("Username check error", err);
      } finally {
        setCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username, isSignupMode]);

  // Debounced Instagram-style Email Uniqueness Live Check
  useEffect(() => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isSignupMode || !cleanEmail || !cleanEmail.includes("@")) {
      setEmailAvailable(null);
      setCheckingEmail(false);
      return;
    }

    setCheckingEmail(true);
    const timer = setTimeout(async () => {
      try {
        const res = await userApi.get(`/auth/check-availability?email=${encodeURIComponent(cleanEmail)}`);
        if (res.data?.success) {
          setEmailAvailable(res.data.data.emailAvailable);
        }
      } catch (err) {
        console.error("Email check error", err);
      } finally {
        setCheckingEmail(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [email, isSignupMode]);

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
      if (usernameAvailable === false) {
        return;
      }
      if (emailAvailable === false) {
        return;
      }

      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      const formattedDob = `${birthYear}-${String(MONTHS.indexOf(birthMonth) || 8).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("name", name || cleanUsername);
        formData.append("username", cleanUsername);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("residency", residency);
        formData.append("dob", formattedDob);
        formData.append("avatar", avatarFile);
        dispatch(signupUser(formData));
      } else {
        dispatch(signupUser({
          name: name || cleanUsername,
          username: cleanUsername,
          email,
          password,
          residency,
          dob: formattedDob
        }));
      }
    } else {
      dispatch(loginUser({ identifier: loginIdentifier, password }));
    }
  };

  return (
    <div className="h-[90vh] flex items-center justify-center p-4 lg:gap-8 xl:gap-16 overflow-hidden">
      
      {/* ─── DESKTOP LEFT COLUMN (LOGIN ONLY) ─── */}
        <div className="hidden lg:flex flex-col items-center justify-center w-[400px] h-[85vh] max-h-[600px] shrink-0">
          <img 
            src="https://cdn.21st.dev/assets/mirror/0d/0d205a1a31d40e927885b0ec5f603407caa10585b5bc6e8b08240402c7417e86.png" 
            alt="Login Banner" 
            className="w-full h-full object-cover"
          />
        </div>
      {/* ─── RIGHT COLUMN (AUTH CARD) ─── */}
      <div className="w-full max-w-[350px] h-[85vh] max-h-[600px] flex flex-col gap-3 transition-all duration-500 ease-in-out">
        {/* Main Auth Box */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-none p-6 flex flex-col items-center flex-1 justify-center transition-all duration-500 relative overflow-hidden">
          
          <div className="mb-4 transition-all duration-500 shrink-0">
            <span className="font-ig-logo text-[40px] tracking-wide" style={{ fontFamily: "Billabong, 'Grand Hotel', cursive" }}>Contestify</span>
          </div>

          {isSignupMode && (
            <p className="text-[15px] font-semibold text-[var(--text-secondary)] text-center leading-relaxed mb-6 px-4">
              Sign up to see photos and videos from your friends.
            </p>
          )}


        {signupSuccess && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-semibold animate-fadeIn flex items-center justify-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>🎉 Account created successfully! Please log in to continue.</span>
          </div>
        )}

        {error && (
          <div className="w-full mb-4 text-rose-500 text-[14px] text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2 w-full">
          {isSignupMode ? (
            <>
              {/* FIELD 1: Mobile number or email */}
              <div className="relative mt-2">
                <input
                  type="text"
                  required
                  placeholder="Mobile number or email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value.toLowerCase().trim());
                    setLoginIdentifier(e.target.value.toLowerCase().trim());
                  }}
                  className="w-full bg-[#fafafa] dark:bg-[#121212] border border-[#dbdbdb] dark:border-[#363636] rounded-[3px] px-2 py-[9px] text-[12px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#a8a8a8] dark:focus:border-[#555]"
                />
                
                {email.trim().length >= 5 && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                    {checkingEmail ? (
                      <Loader2 className="w-4 h-4 text-[#a8a8a8] animate-spin" />
                    ) : emailAvailable === true ? (
                      <CheckCircle2 className="w-4 h-4 text-[#a8a8a8]" />
                    ) : emailAvailable === false ? (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    ) : null}
                  </div>
                )}
              </div>

              {email.includes("@") && emailAvailable === false && (
                <p className="text-[11px] text-rose-400 font-semibold mt-1">
                  ✕ This email is already registered. Please log in.
                </p>
              )}

              {/* FIELD 2: Password */}
              <div className="relative flex items-center mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#fafafa] dark:bg-[#121212] border border-[#dbdbdb] dark:border-[#363636] rounded-[3px] px-2 py-[9px] text-[12px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#a8a8a8] dark:focus:border-[#555]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 text-xs font-semibold text-[var(--text-primary)]"
                >
                  {password.length > 0 && (showPassword ? "Hide" : "Show")}
                </button>
              </div>

              {/* FIELD 5: Birthday (Dropdowns) */}
              <div className="pt-2">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Birthday</span>
                  <HelpCircle className="w-3.5 h-3.5 text-[var(--text-secondary)] cursor-pointer" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="bg-[#fafafa] dark:bg-[#121212] border border-[#dbdbdb] dark:border-[#363636] rounded-[3px] px-2 py-[7px] text-[12px] text-[var(--text-primary)] focus:outline-none cursor-pointer appearance-none"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="bg-[#fafafa] dark:bg-[#121212] border border-[#dbdbdb] dark:border-[#363636] rounded-[3px] px-2 py-[7px] text-[12px] text-[var(--text-primary)] focus:outline-none cursor-pointer appearance-none"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="bg-[#fafafa] dark:bg-[#121212] border border-[#dbdbdb] dark:border-[#363636] rounded-[3px] px-2 py-[7px] text-[12px] text-[var(--text-primary)] focus:outline-none cursor-pointer appearance-none"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* FIELD 3: Name */}
              <div className="relative mt-2">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#fafafa] dark:bg-[#121212] border border-[#dbdbdb] dark:border-[#363636] rounded-[3px] px-2 py-[9px] text-[12px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#a8a8a8] dark:focus:border-[#555]"
                />
              </div>

              {/* FIELD 4: Username */}
              <div className="relative flex items-center mt-1.5">
                <input
                  type="text"
                  required
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className="w-full bg-[#fafafa] dark:bg-[#121212] border border-[#dbdbdb] dark:border-[#363636] rounded-[3px] px-2 py-[9px] pr-8 text-[12px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#a8a8a8] dark:focus:border-[#555]"
                />
                <div className="absolute right-2 flex items-center">
                  {checkingUsername ? (
                    <Loader2 className="w-4 h-4 text-[#a8a8a8] animate-spin" />
                  ) : usernameAvailable === true ? (
                    <CheckCircle2 className="w-4 h-4 text-[#a8a8a8]" />
                  ) : usernameAvailable === false ? (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  ) : null}
                </div>
              </div>


            </>
          ) : (
            /* LOGIN MODE - Username or Email address input */
            <div className="space-y-2 w-full mt-6">
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Phone number, username, or email"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full bg-[#fafafa] dark:bg-[#121212] border border-[#dbdbdb] dark:border-[#363636] rounded-[3px] px-2 py-[9px] text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-[#a8a8a8] dark:focus:border-[#555]"
                />
              </div>

              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#fafafa] dark:bg-[#121212] border border-[#dbdbdb] dark:border-[#363636] rounded-[3px] px-2 py-[9px] pr-12 text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-[#a8a8a8] dark:focus:border-[#555]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 text-xs font-semibold text-[var(--text-primary)] hover:opacity-70"
                >
                  {password.length > 0 && (showPassword ? "Hide" : "Show")}
                </button>
              </div>
            </div>
          )}

          {/* Primary Action Button (Exact Instagram Blue Pill Button) */}
          <div className="pt-2 space-y-4 w-full">
            <button
              type="submit"
              disabled={loading || (isSignupMode && (usernameAvailable === false || emailAvailable === false))}
              className={`w-full py-2 flex items-center justify-center gap-2 text-white font-bold text-[14px] rounded-[8px] transition-all ${
                loading 
                  ? "bg-[#4cb5f9] cursor-not-allowed" 
                  : "bg-[#0095f6] hover:bg-[#1877f2] cursor-pointer"
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSignupMode ? (loading ? "Signing up..." : "Sign up") : (loading ? "Logging in..." : "Log in")}</span>
            </button>
            
            {!isSignupMode && (
              <>
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-px bg-[#dbdbdb] dark:bg-[#363636]"></div>
                  <span className="text-[13px] font-bold text-[#737373] uppercase">OR</span>
                  <div className="flex-1 h-px bg-[#dbdbdb] dark:bg-[#363636]"></div>
                </div>

                <div className="text-center mt-2">
                  <Link 
                    to="/forgot-password" 
                    className="text-[12px] text-[#00376b] dark:text-[#e0f1ff]"
                  >
                    Forgot password?
                  </Link>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
      
      {/* Box 2: Switch modes */}
      <div className="w-full max-w-[350px] bg-[var(--bg-card)] border border-[var(--border-main)] rounded-none p-5 text-center mt-3">
        <p className="text-[14px] text-[var(--text-primary)]">
          {isSignupMode ? "Have an account? " : "Don't have an account? "}
          <button
            type="button"
            onClick={() => setSearchParams({ mode: isSignupMode ? "login" : "signup" })}
            className="font-bold text-[#0095f6] hover:text-[#1877f2] cursor-pointer"
          >
            {isSignupMode ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>

      </div>
    </div>
  );
};
