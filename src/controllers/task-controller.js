const Task = require("../models/Task");

// GET /api/tasks/my-tasks
exports.getMyTasks = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const currentUserId = req.user.id || req.user._id;
    const { status, priority, search, overdue } = req.query;
    const query = {
      assignee: currentUserId,
      isDeleted: false,
    };
    const isOverdue = overdue === "true";

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (search) {
      query.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (isOverdue) {
      query.deadline = {
        $lt: new Date(),
      };
      if (!status) {
        query.status = {
          $ne: "Done",
        };
      }
    }

    const tasks = await Task.find(query)
      .populate("assignee", "fullname email avatar")
      .sort({ deadline: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Get my tasks successfully",
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
