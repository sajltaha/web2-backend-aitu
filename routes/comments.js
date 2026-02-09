import express from "express";
import {
    createComment,
    getAllComments,
    getCommentById,
    getCommentsByTask,
    updateComment,
    deleteComment,
} from "../controllers/commentController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllComments);
router.get("/task/:taskId", getCommentsByTask);
router.get("/:id", getCommentById);

router.post("/", authenticate, createComment);
router.put("/:id", authenticate, updateComment);
router.delete("/:id", authenticate, deleteComment);

export default router;

