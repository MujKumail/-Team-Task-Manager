const prisma = require("../utils/prisma");

const requireProjectAdmin = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user && req.user.userId;

    if (!projectId || !userId) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to manage this project",
      });
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (!membership || membership.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Project admin access is required",
      });
    }

    req.projectMembership = membership;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  requireProjectAdmin,
};
