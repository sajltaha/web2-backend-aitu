const ALLOWED_STATUS = ["todo", "in_progress", "done"];
const ALLOWED_PRIORITY = ["low", "medium", "high"];

export function validateTask(req, res, next) {
    const { title, description, status, priority } = req.body;

    if (!title || !description || !status || !priority) {
        return res.status(400).json({
            message: "title, description, status, priority are required",
        });
    }

    if (!ALLOWED_STATUS.includes(status)) {
        return res.status(400).json({
            message: `status must be one of: ${ALLOWED_STATUS.join(", ")}`,
        });
    }

    if (!ALLOWED_PRIORITY.includes(priority)) {
        return res.status(400).json({
            message: `priority must be one of: ${ALLOWED_PRIORITY.join(", ")}`,
        });
    }

    next();
}
