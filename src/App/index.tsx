
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';

import { theme } from '../theme';

import { AppContext } from './Context';
import { Header } from './Header';
import { DefaultAppState, reducer } from './reducer';
import { SidePanel } from './SidePanel';

export function App(): React.ReactElement {
  const [appState, appDispatch] = React.useReducer(reducer, DefaultAppState);

  const contextValue = React.useMemo(() => ({ state: appState, dispatch: appDispatch }), [appState, appDispatch]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContext.Provider value={contextValue}>
        <SidePanel />
        <Header />
      </AppContext.Provider>
    </ThemeProvider>
  );
}
