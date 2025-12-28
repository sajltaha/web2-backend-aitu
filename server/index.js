import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import weatherRouter from "./routes/weather.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, "../client")));

app.use("/api/weather", weatherRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

