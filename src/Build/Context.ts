import React from 'react';

import type { BuildContextValue } from './reducer';

export const BuildContext = React.createContext<BuildContextValue | undefined>(undefined);
