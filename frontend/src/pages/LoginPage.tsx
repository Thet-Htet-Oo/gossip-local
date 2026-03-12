import React, { useState } from "react";
import { TextField, Button, Container, Typography, Box, Paper } from "@mui/material";
import { LoginForm } from "../types/auth";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({ username: "" });
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log("Attempting login with username:", form.username);

      const res = await axios.post("http://localhost:8000/login", {
        username: form.username
      });

      console.log("Login successful:", res.data);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));


      navigate("/posts");
    } catch (error) {
      console.error("Login error:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {

          setError(error.response.data?.error || `Error: ${error.response.status}`);
        } else if (error.request) {

          setError("Cannot connect to server. Is the backend running?");
        } else {
          setError("Failed to send request");
        }
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#e8f5e9",
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={4}
          sx={{
            padding: 4,
            borderRadius: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="h4" gutterBottom color="green">
            Login
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />

            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                backgroundColor: "green",
                "&:hover": {
                  backgroundColor: "#2e7d32",
                },
              }}
            >
              Enter
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;