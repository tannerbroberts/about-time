
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';

import { Build } from '../Build';
import { Execute } from '../Execute';
import { MigrationBanner } from '../Migration';
import { Schedule } from '../Schedule';
import { theme } from '../theme';

import { BottomNavigation } from './BottomNavigation';
import { AppContext } from './Context';
import { OnlineStatus } from './OnlineStatus';
import { DefaultAppState, reducer } from './reducer';

export function App(): React.ReactElement {
  const [appState, appDispatch] = React.useReducer(reducer, DefaultAppState);

  const contextValue = React.useMemo(() => ({ state: appState, dispatch: appDispatch }), [appState, appDispatch]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContext.Provider value={contextValue}>
        <Box
          component="main"
          sx={{
            paddingBottom: '56px', // Space for bottom navigation
            minHeight: '100vh',
          }}
        >
          {appState.activeTab === 'build' && <Build />}
          {appState.activeTab === 'schedule' && <Schedule />}
          {appState.activeTab === 'track' && <Execute />}
        </Box>
        <BottomNavigation />
        <OnlineStatus />
        <MigrationBanner />
      </AppContext.Provider>
    </ThemeProvider>
  );
}
