import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import tasksRouter from "./routes/tasks.js";

dotenv.config();

const app = express();

app.use(express.json());

// API
app.use("/api/tasks", tasksRouter);

// Static page
app.use(express.static("public"));

// Errors
app.use((err, req, res, next) => {
    if (err?.name === "CastError") {
        return res.status(400).json({ message: "Invalid ID" });
    }
    if (err?.name === "ValidationError") {
        return res.status(400).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 3000;

async function start() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch((e) => {
    console.error("Failed to start:", e);
    process.exit(1);
});
