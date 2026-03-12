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
  Box,
  Alert,
  CircularProgress
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = "http://localhost:8000";

 
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      setError("You need to be logged in to view this page");
      setTimeout(() => navigate("/"), 2000);
      throw new Error("No authentication token found");
    }

    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  };

  // Fetch topics 
  const fetchTopics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("You need to be logged in to view topics");
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const res = await fetch(`${API_URL}/api/topics`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError("Your session has expired. Please login again.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setTimeout(() => navigate("/"), 2000);
          return;
        }
        throw new Error(`Failed to fetch topics: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Topics fetched:", data);
      setTopics(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch topics:", err);
      setTopics([]);
      setError("Failed to load topics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    if (!token || !user) {
      setError("You need to be logged in to access this page");
      setTimeout(() => navigate("/"), 2000);
      return;
    }
    
    fetchTopics();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewTopic({ ...newTopic, [e.target.name]: e.target.value });
    setError(null);
  };

  // Create a new topic
  const handleCreateTopic = async () => {
    if (!newTopic.title.trim() || !newTopic.description.trim()) {
      setError("Title and Description are required!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Your session has expired. Please login again.");
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const res = await fetch(`${API_URL}/api/topics`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newTopic),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Your session has expired. Please login again.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setTimeout(() => navigate("/"), 2000);
          return;
        }
        throw new Error(`Server returned status ${res.status}`);
      }

      const created: Topic = await res.json();
      setTopics([created, ...topics]);
      setNewTopic({ title: "", description: "" });
      setSuccess("Topic created successfully!");
      setError(null);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to create topic:", err);
      setError("Failed to create topic. Please try again.");
    }
  };

  // Delete a topic
  const handleDeleteTopic = async (topicId: number) => {
    if (!window.confirm("Are you sure you want to delete this topic? This will also delete all posts in this topic.")) 
      return;

    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Your session has expired. Please login again.");
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const res = await fetch(`${API_URL}/api/topics/${topicId}`, { 
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError("Your session has expired. Please login again.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setTimeout(() => navigate("/"), 2000);
          return;
        }
        if (res.status === 403) {
          setError("You don't have permission to delete this topic.");
          return;
        }
        throw new Error(`Server returned status ${res.status}`);
      }

      setTopics(topics.filter((t) => t.id !== topicId));
      setSuccess("Topic deleted successfully!");
      setError(null);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to delete topic:", err);
      setError("Failed to delete topic. Please try again.");
    }
  };

 
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    return (
      <Box sx={{ backgroundColor: "#e8f5e9", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Paper sx={{ p: 4, maxWidth: 400, textAlign: "center", borderRadius: 3 }}>
          <Typography variant="h5" sx={{ color: "#d32f2f", mb: 2 }}>
            Access Denied
          </Typography>
          <Typography sx={{ mb: 3 }}>
            You need to be logged in to view this page.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate("/")}
            sx={{ backgroundColor: "#2e7d32", "&:hover": { backgroundColor: "#1b5e20" } }}
          >
            Go to Login
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: "#e8f5e9", minHeight: "100vh", py: 4 }}>
      <Box sx={{ maxWidth: 900, mx: "auto", px: 3 }}>
        <Typography 
          variant="h3" 
          align="center" 
          gutterBottom 
          sx={{ 
            fontWeight: "bold", 
            color: "#2e7d32",
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            mb: 4
          }}
        >
          Manage Topics
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        {/* Create Topic Card */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            borderRadius: 3, 
            mb: 4, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            backgroundColor: '#ffffff'
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ color: "#2e7d32", fontWeight: 'bold', mb: 3 }}>
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
                  borderColor: '#2e7d32',
                  borderWidth: 2
                } 
              },
              '& .MuiInputLabel-root.Mui-focused': { 
                color: '#2e7d32',
                fontWeight: 'bold'
              }
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
                  borderColor: '#2e7d32',
                  borderWidth: 2
                } 
              },
              '& .MuiInputLabel-root.Mui-focused': { 
                color: '#2e7d32',
                fontWeight: 'bold'
              }
            }}
          />

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTopic}
            sx={{ 
              mt: 3, 
              backgroundColor: "#2e7d32", 
              "&:hover": { backgroundColor: "#1b5e20" },
              py: 1.2,
              px: 4,
              fontSize: '1rem'
            }}
          >
            Add Topic
          </Button>
        </Paper>

        <Divider sx={{ mb: 4, backgroundColor: '#81c784', borderWidth: 1 }} />

        {/* Topics Table */}
        <Typography variant="h5" gutterBottom sx={{ color: "#2e7d32", fontWeight: 'bold', mb: 3 }}>
          Existing Topics
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#2e7d32' }} />
          </Box>
        ) : Array.isArray(topics) && topics.length > 0 ? (
          <TableContainer 
            component={Paper} 
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}
          >
            <Table>
              <TableHead sx={{ backgroundColor: "#c8e6c9" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20', fontSize: '1.1rem' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20', fontSize: '1.1rem' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20', fontSize: '1.1rem' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20', fontSize: '1.1rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topics.map((topic) => (
                  <TableRow 
                    key={topic.id}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: '#f1f8e9',
                        transition: 'background-color 0.3s'
                      } 
                    }}
                  >
                    <TableCell sx={{ color: '#2e7d32' }}>{topic.id}</TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>{topic.title}</TableCell>
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
                            backgroundColor: '#d32f2f', 
                            color: 'white',
                            borderColor: '#d32f2f'
                          },
                          borderColor: '#d32f2f',
                          color: '#d32f2f'
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
        ) : (
          <Paper 
            sx={{ 
              p: 4, 
              textAlign: "center", 
              borderRadius: 3,
              backgroundColor: '#ffffff'
            }}
          >
            <Typography sx={{ color: "#666", fontSize: '1.2rem' }}>
              No topics available. Create your first topic above!
            </Typography>
          </Paper>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/posts")}
            sx={{
              mt: 2,
              py: 1.2,
              px: 4,
              borderColor: "#2e7d32",
              color: "#2e7d32",
              borderWidth: 2,
              fontSize: '1rem',
              "&:hover": { 
                borderColor: "#1b5e20", 
                backgroundColor: "#1b5e20", 
                color: "white",
                borderWidth: 2
              }
            }}
          >
            Back to Posts
          </Button>
        </Box>
      </Box>
    </Box>
  );
}