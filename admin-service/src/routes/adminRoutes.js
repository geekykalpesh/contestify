const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.get("/rankings", adminController.getRankings);
router.get("/winners", adminController.getWinners);
router.post("/calculate-winners", adminController.getWinners);
router.get("/participants/paginated", adminController.getParticipantsPaginated);
router.get("/stats", adminController.getAdminStats);
router.put("/kyc/:winnerId", adminController.updateKycStatus);
router.put("/users/bulk-kyc", adminController.bulkUpdateKycStatus);
router.get("/users/export", adminController.exportParticipantsCsv);

module.exports = router;
