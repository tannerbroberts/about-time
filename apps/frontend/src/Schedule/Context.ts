import { createContext } from 'react';

import type { ScheduleContextValue } from './reducer';

export const Context = createContext<ScheduleContextValue | undefined>(undefined);
