import Task from "../models/Task.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";

const populateTask = (query) =>
    query
        .populate("creator", "firstName lastName email")
        .populate("assignee", "firstName lastName email")
        .populate("updatedBy", "firstName lastName email");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

const resolveAssignee = async ({ assigneeId, assigneeEmail, requester }) => {
    if (assigneeId === "" || assigneeEmail === "") {
        return null;
    }

    if (assigneeId) {
        const user = await User.findById(assigneeId);
        if (!user) {
            throw Object.assign(new Error("Assignee not found"), { status: 400 });
        }
        if (requester?.role === "admin" && user.role === "superadmin") {
            throw Object.assign(new Error("Cannot assign tasks to superadmin"), {
                status: 403,
            });
        }
        return user._id;
    }

    if (assigneeEmail) {
        const user = await User.findOne({ email: assigneeEmail.toLowerCase() });
        if (!user) {
            throw Object.assign(new Error("Assignee not found"), { status: 400 });
        }
        if (requester?.role === "admin" && user.role === "superadmin") {
            throw Object.assign(new Error("Cannot assign tasks to superadmin"), {
                status: 403,
            });
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
            updatedBy: req.user._id,
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

        const assignee = await resolveAssignee({
            assigneeId,
            assigneeEmail,
            requester: req.user,
        });
        if (typeof assignee !== "undefined") {
            taskData.assignee = assignee;
        }

        const task = await Task.create(taskData);
        await task.populate("creator", "firstName lastName email");
        await task.populate("assignee", "firstName lastName email");
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
        if (!isSuperAdmin(req.user)) {
            const adminIds = await getAdminIds();
            if (adminIds.length) {
                if (req.user) {
                    filter.$or = [
                        { assignee: { $nin: adminIds } },
                        { assignee: req.user._id },
                        { creator: req.user._id },
                    ];
                } else {
                    filter.assignee = { $nin: adminIds };
                }
            }
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
        if (!isSuperAdmin(req.user) && task.assignee) {
            const adminIds = await getAdminIds();
            if (adminIds.includes(task.assignee._id.toString())) {
                if (!req.user || !canAccessAdminTask(req.user, task)) {
                    return res.status(403).json({ message: "Access denied" });
                }
            }
        }
        res.json(task);
    } catch (error) {
        next(error);
    }
};

export const updateTask = async (req, res, next) => {
    try {
        const { title, description, status, priority, assigneeId, assigneeEmail, dueDate } = req.body;

        const updates = {
            title,
            description,
            status,
            priority,
            updatedBy: req.user._id,
        };

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

        const assignee = await resolveAssignee({
            assigneeId,
            assigneeEmail,
            requester: req.user,
        });
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
            req.user.role !== "superadmin" &&
            (!task.assignee || task.assignee.toString() !== req.user._id.toString())
        ) {
            return res.status(403).json({
                message: "You can only update status of assigned tasks",
            });
        }

        task.status = status;
        task.updatedBy = req.user._id;
        await task.save();
        await task.populate("creator", "firstName lastName email");
        await task.populate("assignee", "firstName lastName email");
        await task.populate("updatedBy", "firstName lastName email");
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

