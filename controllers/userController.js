import User from "../models/User.js";

export const listUsers = async (req, res, next) => {
    try {
        const users = await User.find()
            .select("firstName lastName email role")
            .sort({ createdAt: -1 });
        const items = users.map((user) => ({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            role: user.role,
        }));
        res.json(items);
    } catch (error) {
        next(error);
    }
};

export const updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        if (!role || !["user", "admin"].includes(role)) {
            return res.status(400).json({
                message: "role must be one of: user, admin",
            });
        }

        const user = await User.findById(req.params.id).select("firstName lastName email role");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "superadmin") {
            return res.status(400).json({ message: "Cannot change superadmin role" });
        }

        user.role = role;
        await user.save();

        res.json({
            message: "Role updated successfully",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select("role");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "superadmin") {
            return res.status(400).json({ message: "Cannot delete superadmin" });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        next(error);
    }
};
