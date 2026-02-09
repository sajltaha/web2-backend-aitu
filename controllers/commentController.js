import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

const ADMIN_ROLES = ["admin", "superadmin"];
const isSuperAdmin = (user) => user && user.role === "superadmin";
const canAccessAdminTask = (user, task) => {
    if (!user || !task) return false;
    if (isSuperAdmin(user)) return true;
    const userId = user._id.toString();
    const assigneeId = task.assignee?._id?.toString?.() || task.assignee?.toString?.();
    const creatorId = task.creator?._id?.toString?.() || task.creator?.toString?.();
    return assigneeId === userId || creatorId === userId;
};

const getAdminIds = async () => {
    const admins = await User.find({ role: { $in: ADMIN_ROLES } }).select("_id");
    return admins.map((admin) => admin._id.toString());
};

export const createComment = async (req, res, next) => {
    try {
        const { content, taskId } = req.body;

        if (!content || !taskId) {
            return res.status(400).json({ 
                message: "Content and taskId are required" 
            });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const comment = await Comment.create({
            content,
            task: taskId,
            author: req.user._id,
        });

        await comment.populate("author", "email");

        res.status(201).json(comment);
    } catch (error) {
        next(error);
    }
};

export const getCommentsByTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        if (!isSuperAdmin(req.user) && task.assignee) {
            const adminIds = await getAdminIds();
            if (adminIds.includes(task.assignee.toString())) {
                if (!req.user || !canAccessAdminTask(req.user, task)) {
                    return res.status(403).json({ message: "Access denied" });
                }
            }
        }
        const comments = await Comment.find({ task: taskId })
            .populate("author", "firstName lastName email role")
            .sort({ createdAt: -1 });
        res.json(comments);
    } catch (error) {
        next(error);
    }
};

export const getAllComments = async (req, res, next) => {
    try {
        const filter = {};
        if (!isSuperAdmin(req.user)) {
            const adminIds = await getAdminIds();
            if (adminIds.length) {
                const taskFilter = req.user
                    ? {
                          $or: [
                              { assignee: { $nin: adminIds } },
                              { assignee: req.user._id },
                              { creator: req.user._id },
                          ],
                      }
                    : { assignee: { $nin: adminIds } };

                const allowedTasks = await Task.find(taskFilter).select("_id");
                filter.task = { $in: allowedTasks.map((task) => task._id) };
            }
        }

        const comments = await Comment.find(filter)
            .populate("author", "firstName lastName email role")
            .populate("task", "title")
            .sort({ createdAt: -1 });
        res.json(comments);
    } catch (error) {
        next(error);
    }
};

export const getCommentById = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id)
            .populate("author", "firstName lastName email role")
            .populate("task", "title assignee creator");
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        if (!isSuperAdmin(req.user) && comment.task?.assignee) {
            const adminIds = await getAdminIds();
            if (adminIds.includes(comment.task.assignee.toString())) {
                if (!req.user || !canAccessAdminTask(req.user, comment.task)) {
                    return res.status(403).json({ message: "Access denied" });
                }
            }
        }
        res.json(comment);
    } catch (error) {
        next(error);
    }
};

export const updateComment = async (req, res, next) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: "Content is required" });
        }

        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (
            comment.author.toString() !== req.user._id.toString() &&
            req.user.role !== "admin" &&
            req.user.role !== "superadmin"
        ) {
            return res.status(403).json({ 
                message: "You can only update your own comments" 
            });
        }

        comment.content = content;
        await comment.save();

        await comment.populate("author", "firstName lastName email role");
        res.json(comment);
    } catch (error) {
        next(error);
    }
};

export const deleteComment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (
            comment.author.toString() !== req.user._id.toString() &&
            req.user.role !== "admin" &&
            req.user.role !== "superadmin"
        ) {
            return res.status(403).json({ 
                message: "You can only delete your own comments" 
            });
        }

        await Comment.findByIdAndDelete(req.params.id);
        res.json({ message: "Comment deleted successfully" });
    } catch (error) {
        next(error);
    }
};

