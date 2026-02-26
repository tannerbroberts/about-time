/**
 * Login page component
 */

import { Box, TextField, Button, Typography, Alert, Paper } from '@mui/material';
import { useState } from 'react';

import { useAuth } from './Context';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage = ({ onSwitchToRegister }: LoginPageProps): React.JSX.Element => {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Email and password are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom textAlign="center">
          about-time
        </Typography>
        <Typography variant="subtitle1" gutterBottom textAlign="center" color="text.secondary">
          Sign in to continue
        </Typography>

        {(error || localError) && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {localError || error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            autoComplete="email"
            autoFocus
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="current-password"
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{ mt: 3, mb: 2 }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={onSwitchToRegister}
            disabled={isSubmitting}
          >
            Don't have an account? Sign up
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
