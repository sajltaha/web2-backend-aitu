import express from "express";
import {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask,
} from "../controllers/taskController.js";
import { validateTask } from "../middleware/validateTask.js";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllTasks);

router.get("/:id", getTaskById);

router.post("/", authenticate, requireAdmin, validateTask, createTask);
router.put("/:id", authenticate, validateTask, updateTask);
router.delete("/:id", authenticate, requireAdmin, deleteTask);

export default router;
