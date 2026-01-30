import Comment from "../models/Comment.js";
import Task from "../models/Task.js";

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
        const comments = await Comment.find({ task: taskId })
            .populate("author", "email")
            .sort({ createdAt: -1 });
        res.json(comments);
    } catch (error) {
        next(error);
    }
};

export const getAllComments = async (req, res, next) => {
    try {
        const comments = await Comment.find()
            .populate("author", "email")
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
            .populate("author", "email")
            .populate("task", "title");
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
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

        if (comment.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ 
                message: "You can only update your own comments" 
            });
        }

        comment.content = content;
        await comment.save();

        await comment.populate("author", "email");
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

        if (comment.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
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

