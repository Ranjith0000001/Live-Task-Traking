const taskService = require("../services/taskService");

const getAllTasks = async (req, res) => {
    try {
        const tasks = await taskService.getAllTasks();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createTask = async (req, res) => {
    try {
        const { title } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ error: "Title is required" });
        }
        const task = await taskService.createTask(title.trim());
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, status } = req.body;

        if (status && !["todo", "inprogress", "done"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const task = await taskService.updateTask(id, { title, status });
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteTask = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const task = await taskService.deleteTask(id);
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.json({ message: "Task deleted", task });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAllTasks, createTask, updateTask, deleteTask };