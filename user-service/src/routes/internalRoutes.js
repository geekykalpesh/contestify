const express = require("express");
const router = express.Router();
const internalController = require("../controllers/internalController");

router.get("/contest-data", internalController.getContestData);
router.get("/users/paginated", internalController.getPaginatedUsers);
router.get("/users/stats", internalController.getUserStats);
router.put("/user-kyc-status", internalController.updateUserKycStatus);
router.put("/users/bulk-kyc", internalController.bulkUpdateUserKyc);

module.exports = router;
