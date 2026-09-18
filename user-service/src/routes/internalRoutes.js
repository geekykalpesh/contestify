const express = require("express");
const router = express.Router();
const internalController = require("../controllers/internalController");

router.get("/contest-data", internalController.getContestData);
router.put("/user-kyc-status", internalController.updateUserKycStatus);

module.exports = router;
