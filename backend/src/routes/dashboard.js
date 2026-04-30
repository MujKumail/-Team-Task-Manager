const express = require("express");

const dashboardController = require("../controllers/dashboardController");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, dashboardController.getDashboard);

module.exports = router;
