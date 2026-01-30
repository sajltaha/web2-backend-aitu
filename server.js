import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import tasksRouter from "./routes/tasks.js";
import commentsRouter from "./routes/comments.js";
import authRouter from "./routes/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

if (!process.env.JWT_SECRET) {
    console.error("❌ ERROR: JWT_SECRET is not set in .env file");
    console.error("Please create a .env file with the following content:");
    console.error("JWT_SECRET=your-secret-key-here");
    process.exit(1);
}

if (!process.env.MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI is not set in .env file");
    console.error("Please create a .env file with the following content:");
    console.error("MONGO_URI=mongodb://localhost:27017/taskmanager");
    process.exit(1);
}

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/comments", commentsRouter);

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile("index.html", { root: "public" });
});

app.use(errorHandler);

async function start() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        app.listen(PORT, () => 
            console.log(`Server running on http://localhost:${PORT}`)
        );
    } catch (error) {
        console.error("Failed to start:", error);
        process.exit(1);
    }
}

start();
