import React, { useState } from "react";
import { TextField, Button, Container, Typography, Box, Paper } from "@mui/material";
import { LoginForm } from "../types/auth";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({ username: "", password: "" });
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await axios.post("/login", {
      username: form.username
    });

    localStorage.setItem("user", JSON.stringify(res.data));

    navigate("/posts");
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#e8f5e9", // light green background
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
            />

            {error && <Typography color="error">{error}</Typography>}

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