const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError } = require("../middleware/errorHandler");
const { JWT_SECRET } = require("../middleware/authMiddleware");

const isAdminEmail = (email) => {
  const e = (email || "").toLowerCase();
  return e === "admin@gmail.com" || e === "admin@creator.com";
};

const registerUser = async ({ name, email, username, password, residency, dob, avatarUrl }) => {
  const cleanEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    throw new AppError("This email is already registered. Please log in.", 409);
  }

  const generatedUsername = (username || email.split("@")[0]).toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
  const existingUsername = await User.findOne({ username: generatedUsername });
  if (existingUsername) {
    throw new AppError("This username is already taken. Please choose another.", 409);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const role = isAdminEmail(email) ? "admin" : "user";

  const user = await User.create({
    name,
    email: cleanEmail,
    username: generatedUsername,
    passwordHash,
    residency: residency || "Chhattisgarh",
    dob: dob || "",
    avatarUrl: avatarUrl || "",
    role
  });

  const token = jwt.sign(
    { id: user._id, email: user.email, residency: user.residency, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      residency: user.residency,
      dob: user.dob,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt
    }
  };
};

const loginUser = async ({ email, identifier, password }) => {
  const input = (identifier || email || "").trim();
  if (!input) {
    throw new AppError("Username or email address is required", 400);
  }

  const cleanInput = input.toLowerCase();

  let user = await User.findOne({
    $or: [{ email: cleanInput }, { username: cleanInput }]
  });

  if (!user) {
    const escapedInput = cleanInput.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&");
    user = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${escapedInput}$`, "i") } },
        { username: { $regex: new RegExp(`^${escapedInput}$`, "i") } }
      ]
    });
  }

  if (!user) {
    throw new AppError("Invalid username, email, or password", 401);
  }

  const rawPassword = password || "";
  const cleanPassword = rawPassword.trim();
  const isMatch =
    (await bcrypt.compare(cleanPassword, user.passwordHash)) ||
    (await bcrypt.compare(rawPassword, user.passwordHash));

  if (!isMatch) {
    throw new AppError("Invalid username, email, or password", 401);
  }

  const userRole = user.role === "admin" || isAdminEmail(user.email) ? "admin" : "user";

  // Fallback username if null
  const effectiveUsername = user.username || user.email.split("@")[0];

  const token = jwt.sign(
    { id: user._id, email: user.email, residency: user.residency, role: userRole },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      username: effectiveUsername,
      residency: user.residency,
      avatarUrl: user.avatarUrl || "",
      role: userRole,
      createdAt: user.createdAt
    }
  };
};

const checkAvailability = async ({ username, email }) => {
  const result = { usernameAvailable: true, emailAvailable: true };

  if (username && typeof username === "string" && username.trim()) {
    const u = username.toLowerCase().trim();
    const existingUser = await User.findOne({ username: u });
    result.usernameAvailable = !existingUser;
  }

  if (email && typeof email === "string" && email.trim()) {
    const e = email.toLowerCase().trim();
    const existingEmail = await User.findOne({ email: e });
    result.emailAvailable = !existingEmail;
  }

  return result;
};

const updateResidency = async (userId, residency) => {
  if (!residency || typeof residency !== "string") {
    throw new AppError("Residency field is required", 400);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { residency: residency.trim() },
    { new: true, runValidators: true }
  ).select("-passwordHash");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

const { clearCachePattern } = require("../config/redis");
const { emitUserUpdated } = require("../socket");

const updateAvatar = async (userId, avatarUrl) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { avatarUrl },
    { new: true }
  ).select("-passwordHash");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  await clearCachePattern("feed:cache:*");

  emitUserUpdated({
    userId: user._id,
    avatarUrl: user.avatarUrl
  });

  return user;
};

const deleteAvatar = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { avatarUrl: "" },
    { new: true }
  ).select("-passwordHash");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  await clearCachePattern("feed:cache:*");

  emitUserUpdated({
    userId: user._id,
    avatarUrl: ""
  });

  return user;
};

const updateKycDetails = async (userId, { aadharNumber, aadharMobile, dob, aadharImage }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // 1. Aadhaar Card Number validation (must be 12 digits)
  const cleanAadhaar = (aadharNumber || "").replace(/\D/g, "");
  if (!cleanAadhaar || cleanAadhaar.length !== 12) {
    throw new AppError("Aadhaar Card Number must be exactly 12 numeric digits (e.g. 1234 5678 9012)", 400);
  }

  // 2. Mobile Number validation (must be exactly 10 digits)
  const cleanMobile = (aadharMobile || "").replace(/\D/g, "");
  if (!cleanMobile || cleanMobile.length !== 10) {
    throw new AppError("Aadhaar attached mobile number must be exactly 10 numeric digits", 400);
  }
  if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
    throw new AppError("Aadhaar attached mobile number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9", 400);
  }

  // 3. DOB validation
  if (!dob) {
    throw new AppError("Date of Birth is required", 400);
  }
  const dobDate = new Date(dob);
  const now = new Date();
  if (isNaN(dobDate.getTime()) || dobDate > now) {
    throw new AppError("Please provide a valid Date of Birth in the past", 400);
  }

  // Calculate age
  let age = now.getFullYear() - dobDate.getFullYear();
  const m = now.getMonth() - dobDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dobDate.getDate())) {
    age--;
  }
  if (age < 18) {
    throw new AppError(`You must be at least 18 years old to submit KYC verification (Current age: ${age})`, 400);
  }

  // 4. Document Image check
  const finalImage = aadharImage || user.kycDetails?.aadharImage;
  if (!finalImage) {
    throw new AppError("Aadhaar Card photo / document image is required for KYC submission", 400);
  }

  const formattedAadhaar = cleanAadhaar.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3");

  user.kycDetails = {
    aadharNumber: formattedAadhaar,
    aadharMobile: aadharMobile.trim(),
    dob,
    aadharImage: finalImage,
    status: "PENDING",
    submittedAt: new Date()
  };

  await user.save();
  const result = user.toObject();
  delete result.passwordHash;
  return result;
};

module.exports = {
  registerUser,
  loginUser,
  checkAvailability,
  updateResidency,
  updateAvatar,
  deleteAvatar,
  updateKycDetails
};
