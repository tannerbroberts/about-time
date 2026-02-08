import React from 'react';

import { Header } from './Header';
import { AppProvider } from './Provider';
import { DefaultAppState, reducer } from './reducer';
import { SidePanel } from './SidePanel';

export function App(): React.ReactElement {
  const [appState, appDispatch] = React.useReducer(reducer, DefaultAppState);
  return (
    <AppProvider value={{ state: appState, dispatch: appDispatch }}>
      <SidePanel />
      <Header />
    </AppProvider>
  );
}
