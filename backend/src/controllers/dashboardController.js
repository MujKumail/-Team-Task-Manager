const prisma = require("../utils/prisma");

const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"];

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const now = new Date();

    const [
      totalProjects,
      totalTasks,
      groupedTasks,
      overdueTasks,
      recentTasks,
    ] = await Promise.all([
      prisma.projectMember.count({
        where: { userId },
      }),
      prisma.task.count({
        where: { assigneeId: userId },
      }),
      prisma.task.groupBy({
        by: ["status"],
        where: { assigneeId: userId },
        _count: {
          status: true,
        },
      }),
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          dueDate: {
            lt: now,
          },
          status: {
            not: "DONE",
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          dueDate: "asc",
        },
      }),
      prisma.task.findMany({
        where: {
          assigneeId: userId,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

    const tasksByStatus = TASK_STATUSES.reduce((totals, status) => {
      totals[status] = 0;
      return totals;
    }, {});

    groupedTasks.forEach((group) => {
      tasksByStatus[group.status] = group._count.status;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalProjects,
        totalTasks,
        tasksByStatus,
        overdueTasks,
        recentTasks,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDashboard,
};
