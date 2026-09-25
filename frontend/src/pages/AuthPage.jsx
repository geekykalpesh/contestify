import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  HelpCircle
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

  // Default mode is 'signup' as requested by screenshot
  const isSignupMode = searchParams.get("mode") !== "login";
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
    <div className="min-h-[90vh] flex items-center justify-center p-4">
      <div className="ig-card w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl relative border border-[var(--border-main)]">
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setSearchParams({ mode: isSignupMode ? "login" : "signup" })}
            className="p-1 -ml-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-500/10 transition-colors cursor-pointer"
            title="Go back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Contestify Branded Header */}
        <div className="mb-6 space-y-1">
          <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold text-lg mb-1">
            <div className="w-7 h-7 rounded-lg ig-ring p-0.5 flex items-center justify-center shadow-sm">
              <div className="w-full h-full bg-[var(--bg-main)] rounded-[6px] flex items-center justify-center">
                <Camera className="w-4 h-4 text-[var(--text-primary)]" />
              </div>
            </div>
            <span className="font-ig-logo text-2xl tracking-wide">Contestify</span>
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            {isSignupMode ? "Get started on Contestify" : "Welcome back to Contestify"}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {isSignupMode
              ? "Sign up to see photos and videos from your favorite creators."
              : "Log in with your mobile number, username or email."}
          </p>
        </div>

        {signupSuccess && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-semibold animate-fadeIn flex items-center justify-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>🎉 Account created successfully! Please log in to continue.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignupMode ? (
            <>
              {/* FIELD 1: Mobile number or email */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Mobile number or email
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="Mobile number or email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-[var(--bg-main)] border rounded-2xl px-4 py-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-colors ${
                      emailAvailable === true
                        ? "border-emerald-500/80 bg-emerald-500/5 focus:border-emerald-500"
                        : emailAvailable === false
                        ? "border-rose-500/80 bg-rose-500/5 focus:border-rose-500"
                        : "border-[var(--border-main)] focus:border-sky-500"
                    }`}
                  />
                  <div className="absolute right-3 flex items-center">
                    {checkingEmail ? (
                      <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
                    ) : emailAvailable === true ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : emailAvailable === false ? (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    ) : null}
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-normal">
                  You may receive notifications from us.{" "}
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-sky-500 hover:underline font-semibold">
                    Learn why we ask for your contact information
                  </a>
                </p>

                {email.includes("@") && emailAvailable === false && (
                  <p className="text-[11px] text-rose-400 font-semibold mt-1">
                    ✕ This email is already registered. Please log in.
                  </p>
                )}
              </div>

              {/* FIELD 2: Password */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl pl-4 pr-10 py-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* FIELD 3: Birthday (Month, Day, Year Dropdowns) */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Birthday</label>
                  <HelpCircle className="w-3.5 h-3.5 text-[var(--text-muted)] cursor-pointer" title="Providing your birthday helps make sure you get the right experience for your age." />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-3 py-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-3 py-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-3 py-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* FIELD 4: Name */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-4 py-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* FIELD 5: Unique Username with Live Availability Verification */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Username
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className={`w-full bg-[var(--bg-main)] border rounded-2xl px-4 py-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-colors ${
                      usernameAvailable === true
                        ? "border-emerald-500/80 bg-emerald-500/5 focus:border-emerald-500"
                        : usernameAvailable === false
                        ? "border-rose-500/80 bg-rose-500/5 focus:border-rose-500"
                        : "border-[var(--border-main)] focus:border-sky-500"
                    }`}
                  />
                  <div className="absolute right-3 flex items-center">
                    {checkingUsername ? (
                      <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
                    ) : usernameAvailable === true ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : usernameAvailable === false ? (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    ) : null}
                  </div>
                </div>

                {username.trim().length >= 3 && (
                  <p className={`text-[11px] font-semibold mt-1.5 flex items-center gap-1 ${
                    usernameAvailable === true ? "text-emerald-400" : usernameAvailable === false ? "text-rose-400" : "text-[var(--text-muted)]"
                  }`}>
                    {checkingUsername ? (
                      "Checking username availability..."
                    ) : usernameAvailable === true ? (
                      "✓ Username is available!"
                    ) : usernameAvailable === false ? (
                      "✕ This username is already registered. Please choose another."
                    ) : null}
                  </p>
                )}
              </div>

              {/* FIELD 6: State Residency */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  State Residency
                </label>
                <select
                  value={residency}
                  onChange={(e) => setResidency(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-4 py-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Other State">Other State</option>
                </select>
              </div>

              {/* FIELD 7: Optional Profile Avatar Picture */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Profile Photo (Optional)</label>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="text-[10px] text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1.5 border border-dashed border-[var(--border-main)] hover:border-sky-500 rounded-2xl p-3 bg-slate-500/5 hover:bg-slate-500/10 flex items-center gap-3 cursor-pointer transition-colors"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {avatarPreview ? "Photo selected" : "Click to select avatar photo"}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">JPEG, PNG or WEBP</p>
                  </div>
                </div>
              </div>

              {/* Legal Disclaimers */}
              <div className="pt-2 text-[11px] text-[var(--text-muted)] leading-relaxed space-y-2 border-t border-[var(--border-main)]">
                <p>
                  People who use our service may have uploaded your contact information to Contestify.{" "}
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-sky-500 hover:underline">
                    Learn more.
                  </a>
                </p>
                <p>
                  By tapping Submit, you agree to create an account and to Contestify's{" "}
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-sky-500 font-semibold hover:underline">
                    Terms
                  </a>,{" "}
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-sky-500 font-semibold hover:underline">
                    Privacy Policy
                  </a> and{" "}
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-sky-500 font-semibold hover:underline">
                    Cookies Policy
                  </a>.
                </p>
                <p>
                  The{" "}
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-sky-500 font-semibold hover:underline">
                    Privacy Policy
                  </a>{" "}
                  describes the ways we can use the information we collect when you create an account. For example, we use this information to provide, personalize and improve our products, including ads.
                </p>
              </div>
            </>
          ) : (
            /* LOGIN MODE - Username or Email address input */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Mobile number, username, or email
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mobile number, username, or email"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-4 py-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl pl-4 pr-10 py-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Primary Action Button (Exact Instagram Blue Pill Button) */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={loading || (isSignupMode && (usernameAvailable === false || emailAvailable === false))}
              className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-sm rounded-full shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? "Processing..." : isSignupMode ? "Submit" : "Log in"}</span>
            </button>

            {/* Secondary Action Button (I already have an account / Create new account) */}
            <button
              type="button"
              onClick={() => setSearchParams({ mode: isSignupMode ? "login" : "signup" })}
              className="w-full py-3.5 bg-slate-500/10 hover:bg-slate-500/20 text-[var(--text-primary)] font-bold text-sm rounded-full border border-[var(--border-main)] transition-all active:scale-[0.99] cursor-pointer"
            >
              {isSignupMode ? "I already have an account" : "Create new account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
