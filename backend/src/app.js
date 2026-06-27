const express = require("express");
const cors = require("cors");
const { setupWebSocket } = require("./websocket"); 
const http = require("http");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/tasks", taskRoutes);

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

const server = http.createServer(app); 
setupWebSocket(server);

module.exports = { app, server };