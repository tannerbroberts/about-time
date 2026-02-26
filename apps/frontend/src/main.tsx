import { registerSyncQueueHandler } from '@about-time/api-client';
import { Box, CircularProgress } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { AuthProvider, useAuth, LoginPage, RegisterPage } from './Auth';
import { registerServiceWorker } from './sync/registerSW';
import { addToSyncQueue } from './sync/syncQueue';
import { theme } from './theme';

// Register Service Worker for offline support
registerServiceWorker();

// Register sync queue handler for offline operations
registerSyncQueueHandler(addToSyncQueue);

// eslint-disable-next-line react-refresh/only-export-components
const AuthenticatedApp = (): React.JSX.Element => {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return showRegister ? (
      <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginPage onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
