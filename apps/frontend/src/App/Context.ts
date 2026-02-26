import React from 'react';

import type { AppContextValue } from './reducer';

export const AppContext = React.createContext<AppContextValue | undefined>(undefined);
