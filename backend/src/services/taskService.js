const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getAllTasks = async () => {
    return await prisma.task.findMany({ orderBy: { createdAt: "asc" } });
};

const createTask = async (title) => {
    return await prisma.task.create({
        data: { title, status: "todo" },
    });
};

const updateTask = async (id, data) => {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return null;

    return await prisma.task.update({
        where: { id },
        data: {
            ...(data.title !== undefined && { title: data.title }),
            ...(data.status !== undefined && { status: data.status }),
        },
    });
};

const deleteTask = async (id) => {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return null;

    await prisma.task.delete({ where: { id } });
    return task;
};

module.exports = { getAllTasks, createTask, updateTask, deleteTask };