const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { uploadSingleAvatar, uploadKycDoc } = require("../middleware/uploadMiddleware");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/signup", uploadSingleAvatar, authController.signup);
router.post("/register", uploadSingleAvatar, authController.signup);
router.post("/login", authController.login);
router.get("/check-availability", authController.checkAvailability);
router.get("/me", authenticateToken, authController.getMe);
router.put("/residency", authenticateToken, authController.updateResidency);
router.put("/avatar", authenticateToken, uploadSingleAvatar, authController.updateAvatar);
router.put("/kyc", authenticateToken, uploadKycDoc, authController.updateKyc);

module.exports = router;
