const authService = require("../services/authService");

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

module.exports = {
  signup,
  login,
  checkAvailability,
  getMe,
  updateResidency,
  updateAvatar,
  deleteAvatar,
  updateKyc
};
