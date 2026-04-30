const express = require("express");
const { body, param } = require("express-validator");

const projectController = require("../controllers/projectController");
const auth = require("../middleware/auth");
const { requireProjectAdmin } = require("../middleware/rbac");

const router = express.Router();

const projectIdParam = [
  param("projectId").trim().notEmpty().withMessage("Project ID is required"),
];

const memberIdParam = [
  param("memberId").trim().notEmpty().withMessage("Member ID is required"),
];

const createProjectValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Project name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Project name must be between 2 and 100 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Project description is required")
    .isLength({ max: 1000 })
    .withMessage("Project description must be 1000 characters or fewer"),
];

const addMemberValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail(),
  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["ADMIN", "MEMBER"])
    .withMessage("Role must be ADMIN or MEMBER"),
];

router.use(auth);

router.post("/", createProjectValidation, projectController.createProject);
router.get("/", projectController.getMyProjects);
router.get("/:projectId", projectIdParam, projectController.getProjectById);
router.delete(
  "/:projectId",
  projectIdParam,
  requireProjectAdmin,
  projectController.deleteProject
);
router.get("/:projectId/members", projectIdParam, projectController.getMembers);
router.post(
  "/:projectId/members",
  projectIdParam,
  addMemberValidation,
  requireProjectAdmin,
  projectController.addMember
);
router.delete(
  "/:projectId/members/:memberId",
  projectIdParam,
  memberIdParam,
  requireProjectAdmin,
  projectController.removeMember
);

module.exports = router;
