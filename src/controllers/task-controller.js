const Task = require('../models/Task');
const Project = require('../models/Project');

const taskController = {
    // Tạo Task mới
    createTask: async (req, res) => {
        try {
            const { title, description, projectId, deadline } = req.body;
            const userId = req.user.id; 

            const project = await Project.findById(projectId);
            if (!project) return res.status(404).json({ message: "Dự án không tồn tại" });

            // Kiểm tra quyền: Phải là Owner hoặc Member mới được tạo Task
            const isMember = project.members.includes(userId) || project.owner.toString() === userId;
            if (!isMember) {
                return res.status(403).json({ message: "Bạn không có quyền tạo task trong dự án này" });
            }

            const newTask = new Task({ title, description, projectId, deadline });
            await newTask.save();
            
            res.status(201).json(newTask);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Gán người thực hiện (Assignee)
    assignUser: async (req, res) => {
        try {
            const { taskId } = req.params;
            const { assigneeId } = req.body;

            const task = await Task.findById(taskId);
            if (!task) return res.status(404).json({ message: "Không tìm thấy task" });

            const project = await Project.findById(task.projectId);
            
            // Logic: Người được gán phải thuộc danh sách thành viên dự án
            const isMember = project.members.includes(assigneeId) || project.owner.toString() === assigneeId;
            if (!isMember) {
                return res.status(400).json({ message: "User này không thuộc dự án" });
            }

            task.assignee = assigneeId;
            await task.save();
            res.json({ message: "Gán người thực hiện thành công", task });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Cập nhật Trạng thái và Độ ưu tiên
    updateStatusPriority: async (req, res) => {
        try {
            const { taskId } = req.params;
            const { status, priority } = req.body;

            const updatedTask = await Task.findByIdAndUpdate(
                taskId,
                { status, priority },
                { new: true, runValidators: true } 
            );

            if (!updatedTask) return res.status(404).json({ message: "Không tìm thấy task" });
            res.json(updatedTask);
        } catch (error) {
            res.status(400).json({ message: "Dữ liệu không hợp lệ" });
        }
    },

    // Kiểm tra và cập nhật Deadline
    updateDeadline: async (req, res) => {
        try {
            const { taskId } = req.params;
            const { deadline } = req.body;
            
            const task = await Task.findById(taskId);
            if (!task) return res.status(404).json({ message: "Không tìm thấy task" });

            const newDeadline = new Date(deadline);
            // Logic: Deadline không được trước ngày tạo task
            if (newDeadline < task.createdAt) {
                return res.status(400).json({ message: "Deadline không hợp lệ (phải sau ngày tạo)" });
            }

            task.deadline = newDeadline;
            await task.save();
            res.json({ message: "Cập nhật deadline thành công", task });
        } catch (error) {
            res.status(400).json({ message: "Lỗi định dạng ngày tháng" });
        }
    }
};

module.exports = taskController;