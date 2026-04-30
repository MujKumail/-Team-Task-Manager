const express = require("express");
const { body, param, query } = require("express-validator");

const taskController = require("../controllers/taskController");
const auth = require("../middleware/auth");
const { requireProjectAdmin } = require("../middleware/rbac");

const router = express.Router({ mergeParams: true });

const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];

const projectIdParam = [
  param("projectId").trim().notEmpty().withMessage("Project ID is required"),
];

const taskIdParam = [
  param("taskId").trim().notEmpty().withMessage("Task ID is required"),
];

const optionalIsoDate = (field) =>
  body(field)
    .optional({ values: "null" })
    .isISO8601()
    .withMessage(`${field} must be a valid ISO 8601 date`);

const createTaskValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Task title is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Task title must be between 2 and 150 characters"),
  body("description")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Task description must be 2000 characters or fewer"),
  body("status")
    .optional()
    .isIn(validStatuses)
    .withMessage("Status must be TODO, IN_PROGRESS, or DONE"),
  optionalIsoDate("dueDate"),
  body("assigneeId")
    .optional({ values: "null" })
    .trim()
    .notEmpty()
    .withMessage("Assignee ID cannot be empty"),
];

const updateTaskValidation = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Task title cannot be empty")
    .isLength({ min: 2, max: 150 })
    .withMessage("Task title must be between 2 and 150 characters"),
  body("description")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Task description must be 2000 characters or fewer"),
  body("status")
    .optional()
    .isIn(validStatuses)
    .withMessage("Status must be TODO, IN_PROGRESS, or DONE"),
  optionalIsoDate("dueDate"),
  body("assigneeId")
    .optional({ values: "null" })
    .trim()
    .notEmpty()
    .withMessage("Assignee ID cannot be empty"),
];

const listTasksValidation = [
  query("status")
    .optional()
    .isIn(validStatuses)
    .withMessage("Status must be TODO, IN_PROGRESS, or DONE"),
  query("assigneeId")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Assignee ID cannot be empty"),
];

router.use(auth);

router.get(
  "/",
  projectIdParam,
  listTasksValidation,
  taskController.getTasksByProject
);
router.post(
  "/",
  projectIdParam,
  createTaskValidation,
  requireProjectAdmin,
  taskController.createTask
);
router.get(
  "/:taskId",
  projectIdParam,
  taskIdParam,
  taskController.getTaskById
);
router.patch(
  "/:taskId",
  projectIdParam,
  taskIdParam,
  updateTaskValidation,
  taskController.updateTask
);
router.delete(
  "/:taskId",
  projectIdParam,
  taskIdParam,
  requireProjectAdmin,
  taskController.deleteTask
);

module.exports = router;
