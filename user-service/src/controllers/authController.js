const authService = require("../services/authService");

const signup = async (req, res, next) => {
  try {
    const name = req.body.name || req.body.username;
    const { email, password, residency } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name/username, email, and password are required" });
    }

    let avatarUrl = "";
    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
    }

    const result = await authService.registerUser({ name, email, password, residency, avatarUrl });
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
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const result = await authService.loginUser({ email, password });
    return res.status(200).json({
      success: true,
      message: "Login successful",
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

module.exports = {
  signup,
  login,
  getMe,
  updateResidency,
  updateAvatar,
  updateKyc
};
