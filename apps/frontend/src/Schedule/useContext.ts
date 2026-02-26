import { useContext } from 'react';

import { Context } from './Context';
import type { ScheduleContextValue } from './reducer';

export function useScheduleContext(): ScheduleContextValue {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useScheduleContext must be used within a ScheduleProvider');
  }
  return context;
}
