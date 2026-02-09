import Task from "../models/Task.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";

const populateTask = (query) =>
    query.populate("creator", "email").populate("assignee", "email");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveAssignee = async ({ assigneeId, assigneeEmail }) => {
    if (assigneeId === "" || assigneeEmail === "") {
        return null;
    }

    if (assigneeId) {
        const user = await User.findById(assigneeId);
        if (!user) {
            throw Object.assign(new Error("Assignee not found"), { status: 400 });
        }
        return user._id;
    }

    if (assigneeEmail) {
        const user = await User.findOne({ email: assigneeEmail.toLowerCase() });
        if (!user) {
            throw Object.assign(new Error("Assignee not found"), { status: 400 });
        }
        return user._id;
    }

    return undefined;
};

export const createTask = async (req, res, next) => {
    try {
        const { title, description, status, priority, assigneeId, assigneeEmail, dueDate } = req.body;
        const taskData = {
            title,
            description,
            status,
            priority,
            creator: req.user._id,
        };

        if (typeof dueDate !== "undefined") {
            if (dueDate === "" || dueDate === null) {
                taskData.dueDate = null;
            } else {
                const parsedDate = new Date(dueDate);
                if (Number.isNaN(parsedDate.getTime())) {
                    return res.status(400).json({ message: "Invalid dueDate" });
                }
                taskData.dueDate = parsedDate;
            }
        }

        const assignee = await resolveAssignee({ assigneeId, assigneeEmail });
        if (typeof assignee !== "undefined") {
            taskData.assignee = assignee;
        }

        const task = await Task.create(taskData);
        await task.populate("creator", "email");
        await task.populate("assignee", "email");
        res.status(201).json(task);
    } catch (error) {
        next(error);
    }
};

export const getAllTasks = async (req, res, next) => {
    try {
        const { status, priority, search } = req.query;
        const page = Math.max(1, parseInt(req.query.page || "1", 10));
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "20", 10)));
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (search) {
            const escaped = escapeRegex(search);
            filter.$or = [
                { title: { $regex: escaped, $options: "i" } },
                { description: { $regex: escaped, $options: "i" } },
            ];
        }

        const [items, totalItems] = await Promise.all([
            populateTask(
                Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
            ),
            Task.countDocuments(filter),
        ]);

        res.json({
            items,
            page,
            totalPages: Math.max(1, Math.ceil(totalItems / limit)),
            totalItems,
        });
    } catch (error) {
        next(error);
    }
};

export const getMyTasks = async (req, res, next) => {
    try {
        const { status, priority, search } = req.query;
        const page = Math.max(1, parseInt(req.query.page || "1", 10));
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "20", 10)));
        const skip = (page - 1) * limit;

        const filter = { assignee: req.user._id };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (search) {
            const escaped = escapeRegex(search);
            filter.$or = [
                { title: { $regex: escaped, $options: "i" } },
                { description: { $regex: escaped, $options: "i" } },
            ];
        }

        const [items, totalItems] = await Promise.all([
            populateTask(
                Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
            ),
            Task.countDocuments(filter),
        ]);

        res.json({
            items,
            page,
            totalPages: Math.max(1, Math.ceil(totalItems / limit)),
            totalItems,
        });
    } catch (error) {
        next(error);
    }
};

export const getTaskById = async (req, res, next) => {
    try {
        const task = await populateTask(Task.findById(req.params.id));
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        res.json(task);
    } catch (error) {
        next(error);
    }
};

export const updateTask = async (req, res, next) => {
    try {
        const { title, description, status, priority, assigneeId, assigneeEmail, dueDate } = req.body;

        const updates = { title, description, status, priority };

        if (typeof dueDate !== "undefined") {
            if (dueDate === "" || dueDate === null) {
                updates.dueDate = null;
            } else {
                const parsedDate = new Date(dueDate);
                if (Number.isNaN(parsedDate.getTime())) {
                    return res.status(400).json({ message: "Invalid dueDate" });
                }
                updates.dueDate = parsedDate;
            }
        }

        const assignee = await resolveAssignee({ assigneeId, assigneeEmail });
        if (typeof assignee !== "undefined") {
            updates.assignee = assignee;
        }

        const task = await populateTask(
            Task.findByIdAndUpdate(req.params.id, updates, {
                new: true,
                runValidators: true,
            })
        );
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        res.json(task);
    } catch (error) {
        next(error);
    }
};

export const updateTaskStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        if (
            req.user.role !== "admin" &&
            (!task.assignee || task.assignee.toString() !== req.user._id.toString())
        ) {
            return res.status(403).json({
                message: "You can only update status of assigned tasks",
            });
        }

        task.status = status;
        await task.save();
        await task.populate("creator", "email");
        await task.populate("assignee", "email");
        res.json(task);
    } catch (error) {
        next(error);
    }
};

export const deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        await Comment.deleteMany({ task: task._id });
        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        next(error);
    }
};

