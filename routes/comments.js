import express from "express";
import {
    createComment,
    getAllComments,
    getCommentById,
    getCommentsByTask,
    updateComment,
    deleteComment,
} from "../controllers/commentController.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", optionalAuth, getAllComments);
router.get("/task/:taskId", optionalAuth, getCommentsByTask);
router.get("/:id", optionalAuth, getCommentById);

router.post("/", authenticate, createComment);
router.put("/:id", authenticate, updateComment);
router.delete("/:id", authenticate, deleteComment);

export default router;

