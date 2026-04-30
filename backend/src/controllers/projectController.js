const { validationResult } = require("express-validator");

const prisma = require("../utils/prisma");

const getValidationErrors = (req) => {
  const errors = validationResult(req);
  return errors.isEmpty() ? null : errors.array();
};

const ensureProjectMember = async (projectId, userId) => {
  return prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
  });
};

const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    data: errors,
  });
};

const createProject = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);

    if (errors) {
      return sendValidationError(res, errors);
    }

    const { name, description } = req.body;
    const userId = req.user.userId;

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        members: {
          create: {
            userId,
            role: "ADMIN",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    return next(error);
  }
};

const getMyProjects = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            _count: {
              select: {
                members: true,
                tasks: true,
              },
            },
          },
        },
      },
      orderBy: {
        project: {
          createdAt: "desc",
        },
      },
    });

    const projects = memberships.map((membership) => ({
      ...membership.project,
      myRole: membership.role,
    }));

    return res.status(200).json({
      success: true,
      data: { projects },
    });
  } catch (error) {
    return next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);

    if (errors) {
      return sendValidationError(res, errors);
    }

    const { projectId } = req.params;
    const userId = req.user.userId;
    const membership = await ensureProjectMember(projectId, userId);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this project",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            id: "asc",
          },
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    return next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);

    if (errors) {
      return sendValidationError(res, errors);
    }

    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);

    if (errors) {
      return sendValidationError(res, errors);
    }

    const { projectId } = req.params;
    const { email, role } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const existingMembership = await ensureProjectMember(projectId, user.id);

    if (existingMembership) {
      return res.status(409).json({
        success: false,
        message: "User is already a member of this project",
      });
    }

    const member = await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: { member },
    });
  } catch (error) {
    return next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);

    if (errors) {
      return sendValidationError(res, errors);
    }

    const { projectId, memberId } = req.params;

    const member = await prisma.projectMember.findFirst({
      where: {
        id: memberId,
        projectId,
      },
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Project member not found",
      });
    }

    if (member.role === "ADMIN") {
      const adminCount = await prisma.projectMember.count({
        where: {
          projectId,
          role: "ADMIN",
        },
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "A project must have at least one admin",
        });
      }
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    return res.status(200).json({
      success: true,
      message: "Project member removed successfully",
    });
  } catch (error) {
    return next(error);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);

    if (errors) {
      return sendValidationError(res, errors);
    }

    const { projectId } = req.params;
    const userId = req.user.userId;
    const membership = await ensureProjectMember(projectId, userId);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this project",
      });
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: { members },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createProject,
  getMyProjects,
  getProjectById,
  deleteProject,
  addMember,
  removeMember,
  getMembers,
};
