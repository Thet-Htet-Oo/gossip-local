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
import EditIcon from "@mui/icons-material/Edit";
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
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    secondary: {
      main: '#81c784',
    },
    success: {
      main: '#2e7d32',
    },
    background: {
      default: '#e8f5e9',
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
  
  // Delete dialogs
  const [deletePostDialog, setDeletePostDialog] = useState<{ open: boolean; postId: number | null }>({
    open: false,
    postId: null
  });
  const [deleteCommentDialog, setDeleteCommentDialog] = useState<{ open: boolean; commentId: number | null; postId: number | null }>({
    open: false,
    commentId: null,
    postId: null
  });

  // Edit dialogs
  const [editPostDialog, setEditPostDialog] = useState<{ open: boolean; post: Post | null }>({
    open: false,
    post: null
  });
  const [editCommentDialog, setEditCommentDialog] = useState<{ open: boolean; comment: Comment | null; postId: number | null }>({
    open: false,
    comment: null,
    postId: null
  });

  // Edit form data
  const [editPostData, setEditPostData] = useState<{ title: string; content: string }>({
    title: "",
    content: ""
  });
  const [editCommentData, setEditCommentData] = useState<string>("");

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

  useEffect(() => {
    if (Array.isArray(posts)) {
      posts.forEach(p => fetchLikes(p.id));
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

  const handleReply = async (postId: number, parentId: number) => {
    if (!user || !replyText[parentId]) return;

    try {
      const res = await authFetch(`${API_URL}/api/comments`, {
        method: "POST",
        body: JSON.stringify({
          post_id: postId,
          content: replyText[parentId],
          parent_comment_id: parentId
        }),
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

  const handleCreatePost = async () => {
    if (!user || !newPost.topic_id) {
      alert("Please select a topic or ensure you are logged in.");
      return;
    }

    try {
      const res = await authFetch(`${API_URL}/api/posts`, {
        method: "POST",
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          topic_id: newPost.topic_id
        }),
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

  const handleCreateComment = async (postId: number) => {
    if (!user || !newComment[postId]) return;

    try {
      const res = await authFetch(`${API_URL}/api/comments`, {
        method: "POST",
        body: JSON.stringify({
          post_id: postId,
          content: newComment[postId]
        }),
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

  const handleDeletePost = async (postId: number) => {
    if (!user) return;

    try {
      const res = await authFetch(`${API_URL}/api/posts/${postId}`, {
        method: "DELETE",
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

  const handleDeleteComment = async (commentId: number, postId: number) => {
    if (!user) return;

    try {
      const res = await authFetch(`${API_URL}/api/comments/${commentId}`, {
        method: "DELETE",
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

  // Post edit functions
  const openEditPostDialog = (post: Post) => {
    setEditPostDialog({ open: true, post });
    setEditPostData({ title: post.title, content: post.content });
  };

  const handleUpdatePost = async () => {
    if (!editPostDialog.post) return;

    try {
      const res = await authFetch(`${API_URL}/api/posts/${editPostDialog.post.id}`, {
        method: "PUT",
        body: JSON.stringify(editPostData)
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to update post");
        return;
      }

      const updatedPost = await res.json();
      setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
      setEditPostDialog({ open: false, post: null });
    } catch (err) {
      console.error("Failed to update post:", err);
    }
  };

  // Comment edit functions
  const openEditCommentDialog = (comment: Comment, postId: number) => {
    setEditCommentDialog({ open: true, comment, postId });
    setEditCommentData(comment.content);
  };

  const handleUpdateComment = async () => {
    if (!editCommentDialog.comment || !editCommentDialog.postId) return;

    try {
      const res = await authFetch(`${API_URL}/api/comments/${editCommentDialog.comment.id}`, {
        method: "PUT",
        body: JSON.stringify({
          content: editCommentData
        })
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to update comment");
        return;
      }

      const updatedComment = await res.json();
      setComments(prev => ({
        ...prev,
        [editCommentDialog.postId!]: prev[editCommentDialog.postId!].map(c => 
          c.id === updatedComment.id ? updatedComment : c
        )
      }));
      setEditCommentDialog({ open: false, comment: null, postId: null });
    } catch (err) {
      console.error("Failed to update comment:", err);
    }
  };

  const handleToggleLike = async (postId: number) => {
    if (!user) return;

    try {
      const res = await authFetch(`${API_URL}/api/posts/${postId}/like`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.error("Unauthorized - token might be expired");
          return;
        }
        console.error(`Failed to toggle like, status: ${res.status}`);
        return;
      }

      const data = await res.json();
      setLikes(prev => ({
        ...prev,
        [postId]: { count: data.likes || 0, liked: data.liked || false },
      }));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const displayedPosts = selectedTopic 
    ? posts.filter((p) => p.topic_id === selectedTopic) 
    : posts;

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
            }}
          >
            All Posts
          </Button>

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
              sx={{ mb: 3 }}
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
              sx={{ mb: 2 }}
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
              sx={{ mb: 2 }}
            />
            
            <Button 
              variant="contained" 
              onClick={handleCreatePost} 
              startIcon={<SendIcon />}
              sx={{ 
                mt: 2,
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
              }}
            >
              {user && user.username === post.username && (
                <Box sx={{ position: "absolute", top: 16, right: 56, display: "flex", gap: 1 }}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => openEditPostDialog(post)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
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

              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2, mb: openComments[post.id] ? 2 : 0 }}>
                <Button
                  startIcon={<ThumbUpIcon />}
                  size="medium"
                  variant={likes[post.id]?.liked ? "contained" : "outlined"}
                  onClick={() => handleToggleLike(post.id)}
                  sx={{
                    borderColor: '#2e7d32',
                    borderRadius: '40px',
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
                    borderColor: '#2e7d32',
                    borderRadius: '40px',
                    py: 1,
                    px: 2,
                  }}
                >
                  {openComments[post.id] ? "Hide" : "Show"} Comments ({comments[post.id]?.length || 0})
                </Button>
              </Box>

              {openComments[post.id] && (
                <Box sx={{ mt: 3, borderTop: '1px solid #81c784', pt: 3 }}>
                  {user && (
                    <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Write a comment..."
                        value={newComment[post.id] || ""}
                        onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                      />
                      <Button
                        variant="contained"
                        onClick={() => handleCreateComment(post.id)}
                        disabled={!newComment[post.id]}
                      >
                        Comment
                      </Button>
                    </Box>
                  )}

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
                        {user && user.id === c.user_id && (
                          <Box sx={{ position: "absolute", right: 8, top: 8, display: "flex", gap: 0.5 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => openEditCommentDialog(c, post.id)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
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
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}

                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <b style={{ color: "#2e7d32", fontSize: "1rem" }}>{c.username}</b> •{" "}
                          <span style={{ color: "#666" }}>
                            {new Date(c.created_at).toLocaleString()}
                          </span>
                        </Typography>

                        <Typography sx={{ color: "#333", mb: 1 }}>{c.content}</Typography>

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
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleReply(post.id, c.id)}
                              disabled={!replyText[c.id]}
                            >
                              Reply
                            </Button>
                          </Box>
                        )}
                      </Paper>

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
                            {user && user.id === r.user_id && (
                              <Box sx={{ position: "absolute", right: 6, top: 6, display: "flex", gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => openEditCommentDialog(r, post.id)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
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
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
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

      {/* Delete Post Dialog */}
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

      {/* Delete Comment Dialog */}
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

      {/* Edit Post Dialog */}
      <Dialog
        open={editPostDialog.open}
        onClose={() => setEditPostDialog({ open: false, post: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#2e7d32', fontSize: '1.5rem' }}>Edit Post</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            margin="normal"
            value={editPostData.title}
            onChange={(e) => setEditPostData(prev => ({ ...prev, title: e.target.value }))}
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
            fullWidth
            label="Content"
            margin="normal"
            multiline
            rows={4}
            value={editPostData.content}
            onChange={(e) => setEditPostData(prev => ({ ...prev, content: e.target.value }))}
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
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setEditPostDialog({ open: false, post: null })} 
            size="large"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdatePost} 
            variant="contained" 
            size="large"
            sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' } }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Comment Dialog */}
      <Dialog
        open={editCommentDialog.open}
        onClose={() => setEditCommentDialog({ open: false, comment: null, postId: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#2e7d32', fontSize: '1.5rem' }}>Edit Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Comment"
            margin="normal"
            multiline
            rows={3}
            value={editCommentData}
            onChange={(e) => setEditCommentData(e.target.value)}
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
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setEditCommentDialog({ open: false, comment: null, postId: null })} 
            size="large"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateComment} 
            variant="contained" 
            size="large"
            sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' } }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}