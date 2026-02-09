import express from "express";
import { listUsers, updateUserRole, deleteUser } from "../controllers/userController.js";
import { authenticate, requireAdmin, requireSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, requireAdmin, listUsers);
router.put("/:id/role", authenticate, requireSuperAdmin, updateUserRole);
router.delete("/:id", authenticate, requireSuperAdmin, deleteUser);

export default router;
