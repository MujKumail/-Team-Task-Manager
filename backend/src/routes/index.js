const express = require("express");
const authRoutes = require("./auth");
const dashboardRoutes = require("./dashboard");
const projectRoutes = require("./projects");
const taskRoutes = require("./tasks");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/projects/:projectId/tasks", taskRoutes);
router.use("/projects", projectRoutes);

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
  });
});

module.exports = router;
