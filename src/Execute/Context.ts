import React from 'react';

import type { ExecuteContextValue } from './reducer';

export const Context = React.createContext<ExecuteContextValue | undefined>(undefined);
