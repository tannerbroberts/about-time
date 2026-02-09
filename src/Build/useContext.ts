import React from 'react';

import { BuildContext } from './Context';
import type { BuildContextValue } from './reducer';

export const useBuildContext = (): BuildContextValue => {
  const context = React.useContext(BuildContext);
  if (context === undefined) {
    throw new Error('useBuildContext must be used within a BuildProvider');
  }
  return context;
};
