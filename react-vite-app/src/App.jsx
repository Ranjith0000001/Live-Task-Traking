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
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";

const API = "http://localhost:5000/api/tasks";

const COLUMNS = [
  { id: "todo", title: "To Do", color: "#ff9800" },
  { id: "inprogress", title: "In Progress", color: "#2196f3" },
  { id: "done", title: "Done", color: "#4caf50" },
];

function App() {
  const [tasks, setTasks] = useState({ todo: [], inprogress: [], done: [] });
  const [newTaskText, setNewTaskText] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editText, setEditText] = useState("");
  const [dragTask, setDragTask] = useState(null);

  // Fetch tasks from API
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
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Create task
  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    try {
      await axios.post(API, { title: newTaskText.trim() });
      setNewTaskText("");
      fetchTasks();
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await axios.delete(`${API}/${selectedTask.id}`);
      setAnchorEl(null);
      setSelectedTask(null);
      fetchTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
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
      fetchTasks();
    } catch (err) {
      console.error("Error moving task:", err);
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
      fetchTasks();
    } catch (err) {
      console.error("Error updating task:", err);
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
      fetchTasks();
    } catch (err) {
      console.error("Error moving task:", err);
    }
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

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          component="h1"
          align="center"
          gutterBottom
          sx={{ fontWeight: 700, mb: 4, color: "#333" }}
        >
          Task Board
        </Typography>

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
            disabled={!newTaskText.trim()}
            sx={{ whiteSpace: "nowrap", minWidth: 120 }}
          >
            Add Task
          </Button>
        </Paper>

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
                    label={tasks[column.id].length}
                    size="small"
                    sx={{
                      bgcolor: column.color,
                      color: "#fff",
                      fontWeight: 600,
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  {tasks[column.id].length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      sx={{ mt: 4 }}
                    >
                      No tasks
                    </Typography>
                  ) : (
                    tasks[column.id].map((task) => (
                      <Paper
                        key={task.id}
                        elevation={1}
                        draggable
                        onDragStart={() =>
                          handleDragStart(task)
                        }
                        sx={{
                          p: 1.5,
                          mb: 1.5,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          cursor: "grab",
                          transition: "all 0.2s",
                          "&:hover": {
                            boxShadow: 3,
                            transform:
                              "translateY(-1px)",
                          },
                          opacity:
                            dragTask?.id === task.id
                              ? 0.4
                              : 1,
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
                          onClick={(e) =>
                            handleMenuOpen(e, task)
                          }
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
      </Container>
    </Box>
  );
}

export default App;