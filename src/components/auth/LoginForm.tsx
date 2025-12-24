"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import InputAdornment from '@mui/material/InputAdornment';

interface LoginFormProps {
  type: "customer" | "admin";
  onSubmit: (password: string) => Promise<{ success: boolean; error?: string }>;
}

export default function LoginForm({ type, onSubmit }: LoginFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await onSubmit(password);
      if (result.success) {
        router.push(type === "customer" ? "/store" : "/admin");
        router.refresh();
      } else {
        setError(result.error || "Invalid password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 400 }}>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          placeholder="Enter password"
          autoComplete="off"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={loading}
        size="large"
        sx={{ minHeight: 48 }}
      >
        {loading ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>
    </Box>
  );
}
