import React from 'react';

import { AppContext } from './Context';
import type { AppContextValue } from './reducer';

export function useAppContext(): AppContextValue {
  const context = React.useContext(AppContext);

  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }

  return context;
}
