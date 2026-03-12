import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  SelectChangeEvent, 
  TextField, 
  Button, 
  Typography, 
  Divider, 
  Select, 
  MenuItem, 
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Paper
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SendIcon from "@mui/icons-material/Send";

const API_URL = "http://localhost:8000";

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
        throw new Error("Session expired");
      }
    }
    
    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

const greenTheme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Dark green
      light: '#4caf50', // Medium green
      dark: '#1b5e20', // Deeper green
    },
    secondary: {
      main: '#81c784', // Light green
    },
    success: {
      main: '#2e7d32', // Dark green
    },
    background: {
      default: '#e8f5e9', // Very light green
      paper: '#ffffff',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: '#2e7d32',
          '&:hover': {
            backgroundColor: '#1b5e20',
          },
        },
        outlinedPrimary: {
          borderColor: '#2e7d32',
          color: '#2e7d32',
          '&:hover': {
            borderColor: '#1b5e20',
            backgroundColor: 'rgba(46, 125, 50, 0.04)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        colorError: {
          color: '#d32f2f', 
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#e8f5e9',
          minHeight: '100vh',
          margin: 0,
          padding: 0,
        },
        html: {
          minHeight: '100vh',
          margin: 0,
          padding: 0,
        },
        '#root': {
          minHeight: '100vh',
          backgroundColor: '#e8f5e9',
        },
      },
    },
  },
});

type Post = {
  id: number;
  title: string;
  content: string;
  user_id: number;
  username: string;
  created_at: string;
  topic_id: number;
};

type Topic = {
  id: number;
  title: string;
};

type User = {
  id: number;
  username: string;
};

type Comment = {
  id: number;
  post_id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
  parent_comment_id?: number | null;
};

export default function AllPost() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newPost, setNewPost] = useState({ title: "", content: "", topic_id: 0 });
  const [user, setUser] = useState<User | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "my">("all"); 
  const [comments, setComments] = useState<{ [key:number]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [key:number]: string }>({});
  const [openComments, setOpenComments] = useState<{ [key:number]: boolean }>({});
  const [likes, setLikes] = useState<{ [key: number]: { count: number; liked: boolean } }>({});
  const [replyOpen, setReplyOpen] = useState<{[key:number]:boolean}>({});
  const [replyText, setReplyText] = useState<{[key:number]:string}>({});
  
  // Delete confirmation dialogs
  const [deletePostDialog, setDeletePostDialog] = useState<{ open: boolean; postId: number | null }>({
    open: false,
    postId: null
  });
  const [deleteCommentDialog, setDeleteCommentDialog] = useState<{ open: boolean; commentId: number | null; postId: number | null }>({
    open: false,
    commentId: null,
    postId: null
  });

  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
  const fetchTopics = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/topics`);
      const data = await res.json();
      console.log("Topics fetched:", data);

      if (Array.isArray(data)) {
        setTopics(data);
      } else if (data && data.topics && Array.isArray(data.topics)) {
        setTopics(data.topics);
      } else {
        console.warn("Unexpected topics response format:", data);
        setTopics([]);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
      setTopics([]);
    }
  };
  
  fetchTopics();
}, []);

  // Fetch posts based on filter
 useEffect(() => {
  const fetchPosts = async () => {
    try {
      const url = selectedFilter === "my" && user 
        ? `${API_URL}/api/posts/user/${user.id}` 
        : `${API_URL}/api/posts`;
      console.log("Fetching posts from:", url);
      
      const res = await authFetch(url);
      const data = await res.json();
      console.log("Posts fetched:", data);

      if (Array.isArray(data)) {
        setPosts(data);
      } else if (data && data.posts && Array.isArray(data.posts)) {
        setPosts(data.posts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setPosts([]);
    }
  };
  
  fetchPosts();
}, [selectedFilter, user]);

  useEffect(() => {
    if (Array.isArray(posts)) {
      posts.forEach(p => fetchComments(p.id));
    }
  }, [posts]);

  const handleNewPostChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewPost({ ...newPost, [e.target.name]: e.target.value });
  };

  const handleTopicSelect = (event: SelectChangeEvent<number>) => {
    setNewPost({ ...newPost, topic_id: event.target.value as number });
  };

  const getTopicName = (topic_id: number) => {
    if (!Array.isArray(topics)) return "Unknown";
    const topic = topics.find((t) => t.id === topic_id);
    return topic ? topic.title : "Unknown";
  };

  const fetchComments = async (postId: number) => {
  try {
    const res = await authFetch(`${API_URL}/api/comments/${postId}`);
    const data = await res.json();
    setComments(prev => ({ ...prev, [postId]: Array.isArray(data) ? data : [] }));
  } catch (error) {
    console.error("Error fetching comments:", error);
    setComments(prev => ({ ...prev, [postId]: [] }));
  }
};

// Reply to comment function
  const handleReply = async (postId: number, parentId: number) => {
    if (!user || !replyText[parentId]) return;

    try {
      const res = await fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          post_id: postId,
          content: replyText[parentId],
          parent_comment_id: parentId
        })
      });

      const created = await res.json();

      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), created]
      }));

      setReplyText(prev => ({
        ...prev,
        [parentId]: ""
      }));

      setReplyOpen(prev => ({
        ...prev,
        [parentId]: false
      }));
    } catch (error) {
      console.error("Error creating reply:", error);
    }
  };


  //Post Create function
  const handleCreatePost = async () => {
    if (!user || !newPost.topic_id) {
      alert("Please select a topic or ensure you are logged in.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          topic_id: newPost.topic_id
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const created = await res.json();
      setPosts([created, ...posts]);
      setNewPost({ title: "", content: "", topic_id: 0 });
    } catch (err) {
      console.error("Failed to create post:", err);
    }
  };

  //Comment Crate function
  const handleCreateComment = async (postId: number) => {
    if (!user || !newComment[postId]) return;

    try {
      const res = await fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          post_id: postId,
          content: newComment[postId]
        })
      });

      const created = await res.json();
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), created]
      }));
      setNewComment(prev => ({
        ...prev,
        [postId]: ""
      }));
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  // Delete post function
  const handleDeletePost = async (postId: number) => {
    if (!user) return;

    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to delete post");
        return;
      }

      setPosts(posts.filter(p => p.id !== postId));
      setDeletePostDialog({ open: false, postId: null });
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  // Delete comment function
  const handleDeleteComment = async (commentId: number, postId: number) => {
    if (!user) return;

    try {
      const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to delete comment");
        return;
      }

      setComments(prev => ({
        ...prev,
        [postId]: prev[postId] ? prev[postId].filter(c => c.id !== commentId) : []
      }));
      setDeleteCommentDialog({ open: false, commentId: null, postId: null });
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const toggleComments = (postId: number) => {
    setOpenComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Filter posts by selected topic
  const displayedPosts = selectedTopic 
    ? posts.filter((p) => p.topic_id === selectedTopic) 
    : posts;

  // Fetch likes for each post
const fetchLikes = async (postId: number) => {
  try {
    const res = await authFetch(`${API_URL}/api/posts/${postId}/likes`);
    const data = await res.json();
    setLikes(prev => ({ 
      ...prev, 
      [postId]: { 
        count: data.likes || 0, 
        liked: data.liked || false 
      } 
    }));
  } catch (error) {
    console.error("Error fetching likes:", error);
    setLikes(prev => ({ 
      ...prev, 
      [postId]: { count: 0, liked: false } 
    }));
  }
};

  useEffect(() => {
    if (Array.isArray(posts)) {
      posts.forEach(p => fetchLikes(p.id));
    }
  }, [posts]);

  // Handle like/unlike post
const handleToggleLike = async (postId: number) => {
  if (!user) return;

  try {
    const res = await fetch(`${API_URL}/api/posts/${postId}/like`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`  
      },
      body: JSON.stringify({})
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.error("Unauthorized - token might be expired");
        return;
      }
    }

    const data = await res.json();
    setLikes(prev => ({
      ...prev,
      [postId]: { count: data.likes || 0, liked: data.liked || false }
    }));
  } catch (error) {
    console.error("Error toggling like:", error);
  }
};
  return (
    <ThemeProvider theme={greenTheme}>
      <CssBaseline /> 
      <Box 
        display="flex" 
        maxWidth="100%" 
        minHeight="100vh"
        gap={4} 
        padding={3}
        sx={{
          backgroundColor: '#e8f5e9', 
        }}
      >
        {/* Sidebar */}
        <Box
          width={280}
          sx={{
            position: "sticky",
            top: 24,
            alignSelf: "flex-start",
            backgroundColor: "#ffffff",
            borderRadius: 3,
            padding: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            height: 'calc(100vh - 48px)',
            overflowY: 'auto',
          }}
        >
          {/* All Posts button */}
          <Button
            fullWidth
            variant={selectedFilter === "all" && selectedTopic === null ? "contained" : "outlined"}
            onClick={() => {
              setSelectedFilter("all");
              setSelectedTopic(null);
            }}
            sx={{ 
              mb: 1.5,
              py: 1.2,
              fontSize: '12px',
              ...(selectedFilter === "all" && selectedTopic === null && {
                backgroundColor: '#2e7d32',
                '&:hover': {
                  backgroundColor: '#1b5e20',
                }
              })
            }}
          >
            All Posts
          </Button>

          {/* My Posts button */}
          {user && (
            <Button
              fullWidth
              variant={selectedFilter === "my" ? "contained" : "outlined"}
              onClick={() => {
                setSelectedFilter("my");
                setSelectedTopic(null);
              }}
              sx={{ 
                mb: 2.5,
                py: 1.2,
                fontSize: '12px',
                ...(selectedFilter === "my" && {
                  backgroundColor: '#2e7d32',
                  '&:hover': {
                    backgroundColor: '#1b5e20',
                  }
                })
              }}
            >
              My Posts
            </Button>
          )}
          <Divider sx={{ my: 2, backgroundColor: '#81c784' }} />
          <Typography variant="h5" textAlign="center" sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 2 }}>
            Topics
          </Typography>
          <Divider sx={{ my: 2, backgroundColor: '#81c784' }} />

          {/* Topic buttons */}
          {Array.isArray(topics) && topics.length > 0 ? (
            topics.map((topic) => (
              <Button
                key={topic.id}
                fullWidth
                variant={selectedTopic === topic.id ? "contained" : "outlined"}
                onClick={() => {
                  setSelectedTopic(Number(topic.id));
                  setSelectedFilter("all");
                }}
                sx={{ 
                  mb: 1.5,
                  py: 1.2,
                  fontSize: '12px',
                  ...(selectedTopic === topic.id && {
                    backgroundColor: '#2e7d32',
                    '&:hover': { backgroundColor: '#1b5e20' }
                  })
                }}
              >
                {topic.title}
              </Button>
            ))
          ) : (
            <Typography sx={{ color: '#666', textAlign: 'center', py: 2, fontSize: '12px' }}>
              No topics available
            </Typography>
          )}

          <Button
            variant="contained"
            onClick={() => navigate("/topics")}
            fullWidth
            sx={{
              backgroundColor: '#2e7d32',
              '&:hover': {
                backgroundColor: '#1b5e20',
              },
              py: 1.2,
              fontSize: '12px',
              mt: 2
            }}
          >
            + Add Topic
          </Button>
          <Button
            variant="outlined"
            color="error"
            fullWidth
            sx={{ 
              mt: 3,
              py: 1.2,
              fontSize: '12px',
              borderWidth: 2,
              '&:hover': {
                backgroundColor: 'rgb(189, 7, 7)',
                color: 'white',
                borderWidth: 2,
              }
            }}
            onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("token");
              setUser(null);
              navigate("/");
            }}
          >
            Logout
          </Button>
        </Box>

        {/* Main Content */}
        <Box flex={1}>
          <Typography 
            variant="h3" 
            gutterBottom 
            align="center"
            sx={{ 
              color: '#1b5e20',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              mb: 4
            }}
          >
            {user ? `${user.username}'s Page` : "Welcome"}
          </Typography>

          {/* New Post Form */}
          <Paper 
            elevation={3}
            sx={{ 
              backgroundColor: '#ffffff',
              padding: 4,
              borderRadius: 3,
              mb: 4
            }}
          >
            <Typography variant="h5" sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 3 }}>
              Create a New Post
            </Typography>
            <Select
              value={newPost.topic_id}
              onChange={handleTopicSelect}
              displayEmpty
              fullWidth
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#2e7d32',
                    borderWidth: 2,
                  }
                }
              }}
            >
              <MenuItem value={0} disabled>
                Select Topic
              </MenuItem>
              {Array.isArray(topics) && topics.map((topic) => (
                <MenuItem key={topic.id} value={topic.id}>
                  {topic.title}
                </MenuItem>
              ))}
            </Select>
            <TextField
              label="Title"
              name="title"
              value={newPost.title}
              onChange={handleNewPostChange}
              fullWidth
              margin="normal"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#2e7d32',
                    borderWidth: 2,
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#2e7d32',
                  fontWeight: 'bold',
                }
              }}
            />
            <TextField
              label="Content"
              name="content"
              value={newPost.content}
              onChange={handleNewPostChange}
              fullWidth
              multiline
              rows={4}
              margin="normal"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#2e7d32',
                    borderWidth: 2,
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#2e7d32',
                  fontWeight: 'bold',
                }
              }}
            />
            <Button 
              variant="contained" 
              onClick={handleCreatePost} 
              startIcon={<SendIcon />}
              sx={{ 
                mt: 2,
                backgroundColor: '#2e7d32',
                '&:hover': {
                  backgroundColor: '#1b5e20',
                },
                py: 1.2,
                px: 4,
                fontSize: '1rem',
              }}
            >
              Post
            </Button>
          </Paper>

          <Divider sx={{ my: 4, backgroundColor: '#81c784', borderWidth: 1 }} />

          {/* Posts Feed */}
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{ color: '#1b5e20', fontWeight: 'bold', mb: 3 }}
          >
            {selectedFilter === "my" 
              ? "My Posts"
              : selectedTopic
                ? `Posts in "${Array.isArray(topics) ? (topics.find((t) => t.id === selectedTopic)?.title || "Unknown") : "Unknown"}"`
                : "All Posts"}
          </Typography>

          {(!displayedPosts || displayedPosts.length === 0) && (
            <Typography sx={{ color: '#666', fontStyle: 'italic', fontSize: '1.2rem' }}>
              No posts yet.
            </Typography>
          )}

          {Array.isArray(displayedPosts) && displayedPosts.map((post) => (
            <Paper
              key={post.id}
              elevation={2}
              sx={{
                padding: 3,
                margin: '20px 0',
                borderRadius: 3,
                position: 'relative',
                backgroundColor: '#ffffff',
                '&:hover': {
                  boxShadow: '0 8px 16px rgba(46, 125, 50, 0.2)',
                }
              }}
            >
              {/* Delete post button - only show if user owns the post */}
              {user && user.username === post.username && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setDeletePostDialog({ open: true, postId: post.id })}
                  sx={{ position: "absolute", top: 16, right: 16 }}
                >
                  <DeleteIcon />
                </IconButton>
              )}

              <Typography variant="subtitle1" sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 1 }}>
                #{getTopicName(post.topic_id)}
              </Typography>

              <Typography variant="h5" sx={{ color: '#1b5e20', fontWeight: 'bold', mb: 1 }}>
                {post.title}
              </Typography>
              <Typography sx={{ color: '#333', fontSize: '1.1rem', mb: 2 }}>
                {post.content}
              </Typography>

              <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                By <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>{post.username}</span> at {new Date(post.created_at).toLocaleString()}
              </Typography>

              {/* Like and Comment Buttons */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2, mb: openComments[post.id] ? 2 : 0 }}>
                <Button
                  startIcon={<ThumbUpIcon />}
                  size="medium"
                  variant={likes[post.id]?.liked ? "contained" : "outlined"}
                  onClick={() => handleToggleLike(post.id)}
                  sx={{
                    ...(likes[post.id]?.liked && {
                      backgroundColor: '#2e7d32',
                      '&:hover': {
                        backgroundColor: '#1b5e20',
                      }
                    }),
                    borderColor: '#2e7d32',
                    borderRadius: '40px 40px 40px 40px',
                    color: likes[post.id]?.liked ? 'white' : '#2e7d32',
                    py: 1,
                    px: 2,
                  }}
                >
                  {likes[post.id]?.liked ? "Liked" : "Like"} ({likes[post.id]?.count || 0})
                </Button>

                <Button 
                  startIcon={<ChatBubbleOutlineIcon />} 
                  size="medium" 
                  onClick={() => toggleComments(post.id)}
                  variant={openComments[post.id] ? "contained" : "outlined"}
                  sx={{
                    ...(openComments[post.id] && {
                      backgroundColor: '#2e7d32',
                      '&:hover': {
                        backgroundColor: '#1b5e20',
                      }
                    }),
                    borderColor: '#2e7d32',
                    borderRadius: '40px 40px 40px 40px',
                    color: openComments[post.id] ? 'white' : '#2e7d32',
                    py: 1,
                    px: 2,
                  }}
                >
                  {openComments[post.id] ? "Hide" : "Show"} Comments ({comments[post.id]?.length || 0})
                </Button>
              </Box>

              {/* Comments Section */}
              {openComments[post.id] && (
                <Box sx={{ mt: 3, borderTop: '1px solid #81c784', pt: 3 }}>
                  {/* Add Comment Input */}
                  {user && (
                    <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Write a comment..."
                        value={newComment[post.id] || ""}
                        onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                              borderColor: '#2e7d32',
                            }
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={() => handleCreateComment(post.id)}
                        disabled={!newComment[post.id]}
                        sx={{
                          backgroundColor: '#2e7d32',
                          '&:hover': { backgroundColor: '#1b5e20' },
                          '&.Mui-disabled': {
                            backgroundColor: '#cccccc',
                          }
                        }}
                      >
                        Comment
                      </Button>
                    </Box>
                  )}

                  {/* Comments List */}
                  {comments[post.id]?.filter(c => !c.parent_comment_id).map((c) => (
                    <Box key={c.id} sx={{ mb: 3 }}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          backgroundColor: "#f8f9fa",
                          borderRadius: 2,
                          position: "relative"
                        }}
                      >
                        {/* Delete Comment */}
                        {user && user.id === c.user_id && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setDeleteCommentDialog({
                                open: true,
                                commentId: c.id,
                                postId: post.id
                              })
                            }
                            sx={{ position: "absolute", right: 8, top: 8 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}

                        {/* Comment header */}
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <b style={{ color: "#2e7d32", fontSize: "1rem" }}>{c.username}</b> •{" "}
                          <span style={{ color: "#666" }}>
                            {new Date(c.created_at).toLocaleString()}
                          </span>
                        </Typography>

                        <Typography sx={{ color: "#333", mb: 1 }}>{c.content}</Typography>

                        {/* Reply button */}
                        {user && (
                          <Button
                            size="small"
                            sx={{ color: '#2e7d32' }}
                            onClick={() =>
                              setReplyOpen((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
                            }
                          >
                            Reply
                          </Button>
                        )}

                        {/* Reply Input */}
                        {replyOpen[c.id] && (
                          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                            <TextField
                              size="small"
                              fullWidth
                              placeholder="Write a reply..."
                              value={replyText[c.id] || ""}
                              onChange={(e) =>
                                setReplyText({ ...replyText, [c.id]: e.target.value })
                              }
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#2e7d32',
                                  }
                                }
                              }}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleReply(post.id, c.id)}
                              disabled={!replyText[c.id]}
                              sx={{
                                backgroundColor: "#2e7d32",
                                "&:hover": { backgroundColor: "#1b5e20" },
                                "&.Mui-disabled": {
                                  backgroundColor: "#cccccc",
                                }
                              }}
                            >
                              Reply
                            </Button>
                          </Box>
                        )}
                      </Paper>

                      {/* Replies */}
                      {comments[post.id]?.filter((r) => r.parent_comment_id === c.id).map((r) => (
                        <Box
                          key={r.id}
                          sx={{
                            ml: 4,
                            mt: 2,
                            position: "relative"
                          }}
                        >
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              backgroundColor: "#f5f5f5",
                              borderLeft: "3px solid #81c784",
                              position: "relative"
                            }}
                          >
                            {/* Delete reply */}
                            {user && user.id === r.user_id && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  setDeleteCommentDialog({
                                    open: true,
                                    commentId: r.id,
                                    postId: post.id
                                  })
                                }
                                sx={{ position: "absolute", right: 6, top: 6 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}

                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <b style={{ color: "#2e7d32" }}>{r.username}</b> •{" "}
                              <span style={{ color: "#666" }}>
                                {new Date(r.created_at).toLocaleString()}
                              </span>
                            </Typography>

                            <Typography>{r.content}</Typography>
                          </Paper>
                        </Box>
                      ))}
                    </Box>
                  ))}

                  {(!comments[post.id] || comments[post.id].length === 0) && (
                    <Typography sx={{ color: '#666', textAlign: 'center', py: 2 }}>
                      No comments yet. Be the first to comment!
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Delete Post Confirmation Dialog */}
      <Dialog
        open={deletePostDialog.open}
        onClose={() => setDeletePostDialog({ open: false, postId: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#2e7d32', fontSize: '1.5rem' }}>Delete Post</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '1.1rem' }}>
            Are you sure you want to delete this post? This action cannot be undone and all comments will be deleted as well.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setDeletePostDialog({ open: false, postId: null })}
            size="large"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => deletePostDialog.postId && handleDeletePost(deletePostDialog.postId)} 
            color="error"
            variant="contained"
            size="large"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Comment Confirmation Dialog */}
      <Dialog
        open={deleteCommentDialog.open}
        onClose={() => setDeleteCommentDialog({ open: false, commentId: null, postId: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#2e7d32', fontSize: '1.5rem' }}>Delete Comment</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '1.1rem' }}>
            Are you sure you want to delete this comment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setDeleteCommentDialog({ open: false, commentId: null, postId: null })}
            size="large"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => deleteCommentDialog.commentId && deleteCommentDialog.postId && 
              handleDeleteComment(deleteCommentDialog.commentId, deleteCommentDialog.postId)} 
            color="error"
            variant="contained"
            size="large"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}