import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import tasksRouter from "./routes/tasks.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

// API
app.use("/api/tasks", tasksRouter);

app.use(express.static("public"));

async function start() {
    await mongoose.connect(process.env.MONGO_URI);
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch((e) => {
    console.error("Failed to start:", e);
    process.exit(1);
});
