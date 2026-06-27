import { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Box,
  Grid,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from "@mui/icons-material";

import { useWebSocket } from "./hooks/useWebSocket"; // ADD THIS

const API = "http://localhost:5000/api/tasks";

const COLUMNS = [
  { id: "todo", title: "To Do", color: "#ff9800" },
  { id: "inprogress", title: "In Progress", color: "#2196f3" },
  { id: "done", title: "Done", color: "#4caf50" },
];

function App() {
  // Use WebSocket hook
  const { 
    isConnected, 
    boardState: wsBoardState, 
    setBoardState: setWsBoardState 
  } = useWebSocket();

  // Local state
  const [tasks, setTasks] = useState({ todo: [], inprogress: [], done: [] });
  const [newTaskText, setNewTaskText] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editText, setEditText] = useState("");
  const [dragTask, setDragTask] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Sync WebSocket board state with local state (after initial load, this keeps tasks in sync)
  useEffect(() => {
    if (Object.keys(wsBoardState).length > 0) {
      setTasks(wsBoardState);
    }
  }, [wsBoardState]);

  // Fetch tasks from API (initial load)
  const fetchTasks = async () => {
    try {
      const { data } = await axios.get(API);
      const grouped = { todo: [], inprogress: [], done: [] };
      data.forEach((task) => {
        if (grouped[task.status]) {
          grouped[task.status].push(task);
        }
      });
      setTasks(grouped);
      setWsBoardState(grouped); // Update WebSocket state
    } catch (err) {
      console.error("Error fetching tasks:", err);
      showSnackbar("Error fetching tasks", "error");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Show notification
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Create task
  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    try {
      await axios.post(API, { title: newTaskText.trim() });
      setNewTaskText("");
      await fetchTasks(); // Refresh to get updated state
      showSnackbar("Task created successfully!");
    } catch (err) {
      console.error("Error creating task:", err);
      showSnackbar("Error creating task", "error");
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await axios.delete(`${API}/${selectedTask.id}`);
      setAnchorEl(null);
      setSelectedTask(null);
      showSnackbar("Task deleted!");
    } catch (err) {
      console.error("Error deleting task:", err);
      showSnackbar("Error deleting task", "error");
    }
  };

  // Move task (status update)
  const handleMoveTask = async (direction) => {
    if (!selectedTask) return;
    const columnOrder = ["todo", "inprogress", "done"];
    const currentIndex = columnOrder.indexOf(selectedTask.status);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= columnOrder.length) return;

    try {
      await axios.put(`${API}/${selectedTask.id}`, {
        status: columnOrder[targetIndex],
      });
      setAnchorEl(null);
      setSelectedTask(null);
      showSnackbar(`Task moved to ${COLUMNS[targetIndex].title}`);
    } catch (err) {
      console.error("Error moving task:", err);
      showSnackbar("Error moving task", "error");
    }
  };

  // Edit task
  const handleOpenEdit = () => {
    if (!selectedTask) return;
    setEditText(selectedTask.title);
    setEditDialogOpen(true);
    setAnchorEl(null);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || !selectedTask) return;
    try {
      await axios.put(`${API}/${selectedTask.id}`, {
        title: editText.trim(),
      });
      setEditDialogOpen(false);
      setSelectedTask(null);
      showSnackbar("Task updated!");
    } catch (err) {
      console.error("Error updating task:", err);
      showSnackbar("Error updating task", "error");
    }
  };

  // Drag & Drop
  const handleDragStart = (task) => {
    setDragTask(task);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!dragTask || dragTask.status === targetStatus) {
      setDragTask(null);
      return;
    }
    try {
      await axios.put(`${API}/${dragTask.id}`, { status: targetStatus });
      setDragTask(null);
    } catch (err) {
      console.error("Error moving task:", err);
      showSnackbar("Error moving task", "error");
    }
  };
  const handleDragEnd = () => {
    setDragTask(null);
  };



  // Menu handlers
  const handleMenuOpen = (event, task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleAddTask();
  };

  // Get connection status color
  const getStatusColor = () => {
    return isConnected ? "success.main" : "error.main";
  };

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="lg">
        {/* Header with Connection Status */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, color: "#333" }}
          >
            Task Board
          </Typography>
          
          {/* Connection Status Badge */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isConnected ? (
              <WifiIcon sx={{ color: "success.main" }} />
            ) : (
              <WifiOffIcon sx={{ color: "error.main" }} />
            )}
            <Typography variant="body2" sx={{ color: getStatusColor() }}>
              {isConnected ? "Live" : "Offline"}
            </Typography>
            <Chip
              label={isConnected ? "🟢 Connected" : "🔴 Disconnected"}
              size="small"
              sx={{
                bgcolor: isConnected ? "#e8f5e9" : "#ffebee",
                color: isConnected ? "#2e7d32" : "#c62828",
                fontWeight: 500,
              }}
            />
          </Box>
        </Box>

        {/* Add Task Input */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 4,
            display: "flex",
            gap: 2,
            borderRadius: 2,
            border: "1px solid #e0e0e0",
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Enter task description..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddTask}
            disabled={!newTaskText.trim() || !isConnected}
            sx={{ whiteSpace: "nowrap", minWidth: 120 }}
          >
            Add Task
          </Button>
        </Paper>

        {/* Realtime Status Alert */}
        {!isConnected && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            You are offline. Changes will not sync in real-time. Reconnecting...
          </Alert>
        )}

        {/* Kanban Columns */}
        <Grid container spacing={2}>
          {COLUMNS.map((column) => (
            <Grid item xs={12} md={4} key={column.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #e0e0e0",
                  minHeight: 300,
                  display: "flex",
                  flexDirection: "column",
                  bgcolor:
                    dragTask && dragTask.status !== column.id
                      ? "#f0f8ff"
                      : "transparent",
                  transition: "background-color 0.2s",
                }}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                    pb: 2,
                    borderBottom: `3px solid ${column.color}`,
                  }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: column.color,
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, flex: 1 }}
                  >
                    {column.title}
                  </Typography>
                  <Chip
                    label={tasks[column.id]?.length || 0}
                    size="small"
                    sx={{
                      bgcolor: column.color,
                      color: "#fff",
                      fontWeight: 600,
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  {tasks[column.id]?.length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      sx={{ mt: 4 }}
                    >
                      No tasks
                    </Typography>
                  ) : (
                    tasks[column.id]?.map((task) => (
                      <Paper
                        key={task.id}
                        elevation={1}
                        draggable={isConnected}
                        onDragStart={() => handleDragStart(task)}
                        onDragEnd={handleDragEnd}
                        sx={{
                          p: 1.5,
                          mb: 1.5,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          cursor: isConnected ? "grab" : "default",
                          transition: "all 0.2s",
                          "&:hover": {
                            boxShadow: isConnected ? 3 : 1,
                            transform: isConnected ? "translateY(-1px)" : "none",
                          },
                          opacity: dragTask?.id === task.id ? 0.4 : 1,
                          borderLeft: `4px solid ${column.color}`,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            flex: 1,
                            wordBreak: "break-word",
                          }}
                        >
                          {task.title}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, task)}
                          disabled={!isConnected}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Paper>
                    ))
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Task Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleOpenEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          {selectedTask && selectedTask.status !== "todo" && (
            <MenuItem onClick={() => handleMoveTask(-1)}>
              ← Move to{" "}
              {COLUMNS[
                COLUMNS.findIndex(
                  (c) => c.id === selectedTask.status
                ) - 1
              ]?.title || "Previous"}
            </MenuItem>
          )}
          {selectedTask && selectedTask.status !== "done" && (
            <MenuItem onClick={() => handleMoveTask(1)}>
              Move to{" "}
              {COLUMNS[
                COLUMNS.findIndex(
                  (c) => c.id === selectedTask.status
                ) + 1
              ]?.title || "Next"}{" "}
              →
            </MenuItem>
          )}
          <MenuItem
            onClick={handleDeleteTask}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Edit Task Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Task</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              margin="dense"
              label="Task Title"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSaveEdit();
              }}
              variant="outlined"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              variant="contained"
              disabled={!editText.trim()}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default App;