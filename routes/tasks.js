import express from "express";
import {
    createTask,
    getAllTasks,
    getMyTasks,
    getTaskById,
    updateTask,
    updateTaskStatus,
    deleteTask,
} from "../controllers/taskController.js";
import { validateTask } from "../middleware/validateTask.js";
import { validateTaskStatus } from "../middleware/validateTask.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", optionalAuth, getAllTasks);

router.get("/mine", authenticate, getMyTasks);

router.get("/:id", optionalAuth, getTaskById);

router.post("/", authenticate, requireAdmin, validateTask, createTask);
router.put("/:id", authenticate, requireAdmin, validateTask, updateTask);
router.patch("/:id/status", authenticate, validateTaskStatus, updateTaskStatus);
router.delete("/:id", authenticate, requireAdmin, deleteTask);

export default router;
