import express from "express";
import Task from "../models/Task.js";
import { validateTask } from "../middleware/validateTask.js";

const router = express.Router();

// CREATE
router.post("/", validateTask, async (req, res, next) => {
    try {
        const created = await Task.create(req.body);
        res.status(201).json(created);
    } catch (e) {
        next(e);
    }
});

// READ ALL
router.get("/", async (req, res, next) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });
        res.json(tasks);
    } catch (e) {
        next(e);
    }
});

// UPDATE
router.put("/:id", validateTask, async (req, res, next) => {
    try {
        const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updated) return res.status(404).json({ message: "Not found" });
        res.json(updated);
    } catch (e) {
        next(e);
    }
});

// DELETE
router.delete("/:id", async (req, res, next) => {
    try {
        const deleted = await Task.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted" });
    } catch (e) {
        next(e);
    }
});

export default router;
