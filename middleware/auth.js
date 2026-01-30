import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }
        res.status(500).json({ message: "Authentication error", error: error.message });
    }
};

export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({ 
            message: "Access denied. Admin role required." 
        });
    }

    next();
};

