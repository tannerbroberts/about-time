import React from 'react';

import { Context } from './Context';
import type { ExecuteContextValue } from './reducer';

export function useExecuteContext(): ExecuteContextValue {
  const context = React.useContext(Context);
  if (context === undefined) {
    throw new Error('useExecuteContext must be used within ExecuteProvider');
  }
  return context;
}
