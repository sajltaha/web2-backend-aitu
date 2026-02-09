import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        assignee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        status: {
            type: String,
            required: true,
            enum: ["todo", "in_progress", "done"],
            default: "todo",
        },
        priority: {
            type: String,
            required: true,
            enum: ["low", "medium", "high"],
            default: "medium",
        },
        dueDate: {
            type: Date,
            default: null,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

taskSchema.index({ status: 1, priority: 1, createdAt: -1 });
taskSchema.index({ assignee: 1, status: 1 });

export default mongoose.model("Task", taskSchema);
