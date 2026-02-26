/**
 * Registration page component
 */

import { Box, TextField, Button, Typography, Alert, Paper } from '@mui/material';
import { useState } from 'react';

import { useAuth } from './Context';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export const RegisterPage = ({ onSwitchToLogin }: RegisterPageProps): React.JSX.Element => {
  const { register, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Email and password are required');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, displayName || undefined);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Registration failed');
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
          Create your account
        </Typography>

        {(error || localError) && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {localError || error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Display Name (optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            margin="normal"
            autoComplete="name"
            autoFocus
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            autoComplete="email"
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="new-password"
            helperText="Minimum 8 characters"
          />
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="new-password"
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{ mt: 3, mb: 2 }}
          >
            {isSubmitting ? 'Creating account...' : 'Sign Up'}
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={onSwitchToLogin}
            disabled={isSubmitting}
          >
            Already have an account? Sign in
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
