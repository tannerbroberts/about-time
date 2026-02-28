import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React from 'react';

import { useAuth } from '../Auth';

export function TopAppBar(): React.ReactElement {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async (): Promise<void> => {
    try {
      setLoggingOut(true);
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      setLoggingOut(false);
    }
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          About Time
        </Typography>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonIcon fontSize="small" />
              <Typography variant="body2">
                {user.displayName || user.email}
              </Typography>
            </Box>

            <Tooltip title="Logout">
              <IconButton
                color="inherit"
                onClick={handleLogout}
                disabled={loggingOut}
                aria-label="logout"
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
