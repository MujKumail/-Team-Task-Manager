const { validationResult } = require("express-validator");

const prisma = require("../utils/prisma");

const selectSafeUser = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
};

const taskInclude = {
  assignee: {
    select: selectSafeUser,
  },
};

const getValidationErrors = (req) => {
  const errors = validationResult(req);
  return errors.isEmpty() ? null : errors.array();
};

const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    data: errors,
  });
};

const getProjectMembership = (projectId, userId) => {
  return prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
  });
};

const getTaskInProject = (projectId, taskId) => {
  return prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
    },
    include: taskInclude,
  });
};

const ensureAssigneeIsProjectMember = async (projectId, assigneeId) => {
  if (!assigneeId) {
    return true;
  }

  const membership = await getProjectMembership(projectId, assigneeId);
  return Boolean(membership);
};

const buildTaskData = (body, allowedFields) => {
  const data = {};

  if (allowedFields.includes("title") && body.title !== undefined) {
    data.title = body.title.trim();
  }

  if (allowedFields.includes("description") && body.description !== undefined) {
    data.description = body.description === null ? null : body.description.trim();
  }

  if (allowedFields.includes("status") && body.status !== undefined) {
    data.status = body.status;
  }

  if (allowedFields.includes("dueDate") && body.dueDate !== undefined) {
    data.dueDate = body.dueDate === null ? null : new Date(body.dueDate);
  }

  if (allowedFields.includes("assigneeId") && body.assigneeId !== undefined) {
    data.assigneeId = body.assigneeId;
  }

  return data;
};

const createTask = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);

    if (errors) {
      return sendValidationError(res, errors);
    }

    const { projectId } = req.params;
    const data = buildTaskData(req.body, [
      "title",
      "description",
      "status",
      "dueDate",
      "assigneeId",
    ]);

    const assigneeIsMember = await ensureAssigneeIsProjectMember(
      projectId,
      data.assigneeId
    );

    if (!assigneeIsMember) {
      return res.status(400).json({
        success: false,
        message: "Assignee must be a member of this project",
      });
    }

    const task = await prisma.task.create({
      data: {
        ...data,
        projectId,
      },
      include: taskInclude,
    });

    return res.status(201).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    return next(error);
  }
};

const getTasksByProject = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);

    if (errors) {
      return sendValidationError(res, errors);
    }

    const { projectId } = req.params;
    const userId = req.user.userId;
    const membership = await getProjectMembership(projectId, userId);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this project",
      });
    }

    const { status, assigneeId } = req.query;
    const where = { projectId };

    if (status) {
      where.status = status;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    return next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);

    if (errors) {
      return sendValidationError(res, errors);
    }

    const { projectId, taskId } = req.params;
    const userId = req.user.userId;
    const membership = await getProjectMembership(projectId, userId);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this project",
      });
    }

    const task = await getTaskInProject(projectId, taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    return next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);

    if (errors) {
      return sendValidationError(res, errors);
    }

    const { projectId, taskId } = req.params;
    const userId = req.user.userId;
    const membership = await getProjectMembership(projectId, userId);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this project",
      });
    }

    const existingTask = await getTaskInProject(projectId, taskId);

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const isAdmin = membership.role === "ADMIN";
    const isAssignedMember = existingTask.assigneeId === userId;

    if (!isAdmin) {
      const requestedFields = Object.keys(req.body);
      const onlyStatusUpdate =
        requestedFields.length > 0 &&
        requestedFields.every((field) => field === "status");

      if (!isAssignedMember || !onlyStatusUpdate) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this task",
        });
      }
    }

    const allowedFields = isAdmin
      ? ["title", "description", "status", "dueDate", "assigneeId"]
      : ["status"];
    const data = buildTaskData(req.body, allowedFields);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid task fields were provided",
      });
    }

    if (isAdmin && data.assigneeId !== undefined) {
      const assigneeIsMember = await ensureAssigneeIsProjectMember(
        projectId,
        data.assigneeId
      );

      if (!assigneeIsMember) {
        return res.status(400).json({
          success: false,
          message: "Assignee must be a member of this project",
        });
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
      include: taskInclude,
    });

    return res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    return next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);

    if (errors) {
      return sendValidationError(res, errors);
    }

    const { projectId, taskId } = req.params;
    const task = await getTaskInProject(projectId, taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
  getTaskById,
};
