import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import React from 'react';

import type { ViewType } from './reducer';

interface ViewSwitcherProps {
  currentView: ViewType;
  onChange: (view: ViewType) => void;
}

export function ViewSwitcher({ currentView, onChange }: ViewSwitcherProps): React.ReactElement {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newView: ViewType | null): void => {
    if (newView) {
      onChange(newView);
    }
  };

  return (
    <ToggleButtonGroup
      value={currentView}
      exclusive
      onChange={handleChange}
      size="small"
      aria-label="calendar view"
    >
      <ToggleButton value="day" aria-label="day view">
        Day
      </ToggleButton>
      <ToggleButton value="week" aria-label="week view">
        Week
      </ToggleButton>
      <ToggleButton value="month" aria-label="month view">
        Month
      </ToggleButton>
      <ToggleButton value="year" aria-label="year view">
        Year
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
