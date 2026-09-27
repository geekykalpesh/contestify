const authService = require("../services/authService");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const PasswordResetToken = require("../models/PasswordResetToken");
const { sendPasswordResetEmail } = require("../services/emailService");
const { AppError } = require("../middleware/errorHandler");

const signup = async (req, res, next) => {
  try {
    const { name, email, username, password, residency, dob } = req.body;
    const fullName = name || username;
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    let avatarUrl = "";
    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
    }

    const result = await authService.registerUser({ name: fullName, email, username, password, residency, dob, avatarUrl });
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const identifier = req.body.identifier || req.body.email || req.body.username;
    const { password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: "Username/Email and password are required" });
    }

    const result = await authService.loginUser({ identifier, password });
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const checkAvailability = async (req, res, next) => {
  try {
    const { username, email } = req.query;
    const result = await authService.checkAvailability({ username, email });
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

const updateResidency = async (req, res, next) => {
  try {
    const { residency } = req.body;
    const updatedUser = await authService.updateResidency(req.user._id, residency);
    return res.status(200).json({
      success: true,
      message: `Residency updated to ${updatedUser.residency}`,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Avatar image file is required" });
    }
    const avatarUrl = `/uploads/${req.file.filename}`;
    const updatedUser = await authService.updateAvatar(req.user._id, avatarUrl);
    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

const deleteAvatar = async (req, res, next) => {
  try {
    const updatedUser = await authService.deleteAvatar(req.user._id);
    return res.status(200).json({
      success: true,
      message: "Profile picture removed successfully",
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

const updateKyc = async (req, res, next) => {
  try {
    const { aadharNumber, aadharMobile, dob } = req.body;
    let aadharImage = "";
    if (req.file) {
      aadharImage = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await authService.updateKycDetails(req.user._id, {
      aadharNumber,
      aadharMobile,
      dob,
      aadharImage
    });

    return res.status(200).json({
      success: true,
      message: "KYC details submitted successfully",
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { displayName, bio } = req.body;
    const updatedUser = await authService.updateProfile(req.user._id, { displayName, bio });
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  checkAvailability,
  getMe,
  updateResidency,
  updateAvatar,
  deleteAvatar,
  updateKyc,
  updateProfile,
  forgotPassword,
  resetPassword
};

// ─── Forgot Password ────────────────────────────────────────────────────────
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always respond with success to prevent email enumeration attacks
    if (!user) {
      return res.status(200).json({ success: true, message: "If that email exists, a reset link has been sent." });
    }

    // Delete any existing tokens for this user
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Generate a secure 32-byte random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await PasswordResetToken.create({
      userId: user._id,
      token: rawToken,
      expiresAt
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailErr) {
      console.error("Local Nodemailer Error (Expected on Render Free):", emailErr.message);
      
      // Fallback: Send email via Vercel Serverless Function using standard HTTP (which Render allows)
      try {
        const fetch = (await import("node-fetch")).default || global.fetch;
        const vercelRes = await fetch(`${process.env.FRONTEND_URL}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            to: user.email, 
            resetUrl,
            emailUser: process.env.EMAIL_USER,
            emailPass: process.env.EMAIL_PASS
          })
        });
        
        if (!vercelRes.ok) throw new Error("Vercel API failed");
      } catch (vercelErr) {
        console.error("Vercel Email Fallback Error:", vercelErr.message);
        return res.status(200).json({
          success: true,
          message: "Email blocked by host. Please use this link to reset your password.",
          resetUrl
        });
      }
    }

    return res.status(200).json({ success: true, message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    next(err);
  }
}

// ─── Reset Password ────────────────────────────────────────────────────────
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: "Token and new password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    // Find valid, non-expired token
    const tokenDoc = await PasswordResetToken.findOne({
      token,
      expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) {
      return res.status(400).json({ success: false, message: "Reset link is invalid or has expired. Please request a new one." });
    }

    // Hash new password and save
    const hashed = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(tokenDoc.userId, { passwordHash: hashed });

    // Delete the used token (one-time use)
    await PasswordResetToken.deleteOne({ _id: tokenDoc._id });

    return res.status(200).json({ success: true, message: "Password reset successfully! You can now log in with your new password." });
  } catch (err) {
    next(err);
  }
}
