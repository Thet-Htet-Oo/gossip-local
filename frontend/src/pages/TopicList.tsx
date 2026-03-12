import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";

type Topic = {
  id: number;
  title: string;
  description: string;
};

export default function Topics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState({ title: "", description: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data: Topic[]) => setTopics(data || []))
      .catch((err) => console.error(err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewTopic({ ...newTopic, [e.target.name]: e.target.value });
  };

  const handleCreateTopic = async () => {
    if (!newTopic.title.trim() || !newTopic.description.trim()) {
    alert("Title and Description are required!");
    return;
  }
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTopic),
      });

      const created: Topic = await res.json();
      setTopics([created, ...topics]);
      setNewTopic({ title: "", description: "" });

    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    if (!window.confirm("Are you sure you want to delete this topic?")) return;

    try {
      const res = await fetch(`/api/topics/${topicId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(`Server returned status ${res.status}`);

      setTopics(topics.filter((t) => t.id !== topicId));

    } catch (err) {
      console.error("Failed to delete topic:", err);
    }
  };

  return (
    <Box
    sx={{
      backgroundColor: "#e8f5e9",
      minHeight: "100vh",
      width: "100%",
      py: 4
    }}
  >
    {/* Centered Content */}
    <Box
      sx={{
        maxWidth: 900,
        margin: "0 auto",
        px: 3
      }}
    >
      <Typography
        variant="h3"
        align="center"
        gutterBottom
        sx={{ fontWeight: "bold", color: "#2e7d32" }}
      >
        Topics
      </Typography>

      {/* Create Topic Card */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          mb: 4,
          boxShadow: 3
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ color: "#2e7d32" }}>
          Create a New Topic
        </Typography>

        <TextField
          label="Title"
          name="title"
          value={newTopic.title}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          sx={{
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': {
                borderColor: '#2e7d32', // Green border when focused
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#2e7d32', // Green label when focused
            },
          }}
        />

        <TextField
          label="Description"
          name="description"
          value={newTopic.description}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
          margin="normal"
          required
          sx={{
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': {
                borderColor: '#2e7d32', // Green border when focused
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#2e7d32', // Green label when focused
            },
          }}
        />

        <Button
          variant="contained"
          onClick={handleCreateTopic}
          startIcon={<AddIcon />}
          sx={{
            mt: 2,
            backgroundColor: "#2e7d32",
            "&:hover": { backgroundColor: "#1b5e20" }
          }}
        >
          Add Topic
        </Button>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      {/* Topics Table */}
      <Typography variant="h5" gutterBottom sx={{ color: "#2e7d32" }}>
        Topics List
      </Typography>

      {topics.length === 0 ? (
        <Typography>No topics yet.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#c8e6c9" }}>
              <TableRow>
                <TableCell><b>ID</b></TableCell>
                <TableCell><b>Title</b></TableCell>
                <TableCell><b>Description</b></TableCell>
                <TableCell><b>Action</b></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell>{topic.id}</TableCell>
                  <TableCell>{topic.title}</TableCell>
                  <TableCell>{topic.description}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteTopic(topic.id)}
                       sx={{ 
                        '&:hover': {
                            backgroundColor: 'rgb(189, 7, 7)',
                            color: 'white',
                        }
                        }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        </TableContainer>
      )}

      <Button
        variant="outlined"
        onClick={() => navigate("/posts")}
        startIcon={<ArrowBackIcon />}
        sx={{
          mt: 3,
          borderColor: "#2e7d32",
          color: "#2e7d32",
          "&:hover": {
            borderColor: "#1b5e20",
            backgroundColor: "#1b5e20",
            color: "white"
          }
        }}
      > 
        Back to Posts
      </Button>
    </Box>
    </Box>

  );

  
}