const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.get("/rankings", adminController.getRankings);
router.get("/winners", adminController.getWinners);
router.post("/calculate-winners", adminController.getWinners);
router.put("/kyc/:winnerId", adminController.updateKycStatus);

module.exports = router;
