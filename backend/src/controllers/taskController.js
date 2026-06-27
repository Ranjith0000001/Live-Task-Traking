const taskService = require("../services/taskService");
const { broadcastUpdate, updateCurrentState } = require("../websocket"); 
const { groupTasksByStatus } = require("../utils/taskUtils");

const getAllTasks = async (req, res) => {
    try {
        const tasks = await taskService.getAllTasks();
        const groupedTasks = groupTasksByStatus(tasks);
        updateCurrentState(groupedTasks); 
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

        const allTasks = await taskService.getAllTasks();
        const groupedTasks = groupTasksByStatus(allTasks);
        
        updateCurrentState(groupedTasks);
        
        broadcastUpdate({ 
            type: 'TASK_ADDED',
            payload: {
                task: task,
                status: 'todo'
            }
        });
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

          const allTasks = await taskService.getAllTasks();
        const groupedTasks = groupTasksByStatus(allTasks);
        
        updateCurrentState(groupedTasks); 
        
        broadcastUpdate({ 
            type: 'TASK_UPDATED',
            payload: {
                task: task,
                changes: { title, status }
            }
        });
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

        const allTasks = await taskService.getAllTasks();
        const groupedTasks = groupTasksByStatus(allTasks);
        
        updateCurrentState(groupedTasks); 
        
        broadcastUpdate({ 
            type: 'TASK_DELETED',
            payload: {
                taskId: id,
                task: task
            }
        });
        res.json({ message: "Task deleted", task });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAllTasks, createTask, updateTask, deleteTask };