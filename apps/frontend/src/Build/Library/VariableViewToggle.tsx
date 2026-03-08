import CompressIcon from '@mui/icons-material/Compress';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import React from 'react';

import { useBuildStore } from '../store';

/**
 * Toggle button to switch between composite and expanded variable views
 */
export function VariableViewToggle(): React.ReactElement {
  const variableViewMode = useBuildStore((state) => state.variableViewMode);
  const setVariableViewMode = useBuildStore((state) => state.setVariableViewMode);

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: 'composite' | 'expanded' | null,
  ): void => {
    if (newMode !== null) {
      setVariableViewMode(newMode);
    }
  };

  return (
    <ToggleButtonGroup
      value={variableViewMode}
      exclusive
      onChange={handleChange}
      aria-label="variable view mode"
      size="small"
    >
      <ToggleButton value="composite" aria-label="composite view">
        <Tooltip title="Composite View: Show high-level units">
          <CompressIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="expanded" aria-label="expanded view">
        <Tooltip title="Expanded View: Show all atomic values with sources">
          <ExpandMoreIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
