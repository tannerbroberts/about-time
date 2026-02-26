import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import React from 'react';

import { useBuildStore } from '../../store';
import { formatDuration } from '../../utils/positioning';

export function Breadcrumbs(): React.ReactElement {
  const focusedLineage = useBuildStore((state) => state.focusedLineage);
  const templates = useBuildStore((state) => state.templates);
  const setFocusedLineage = useBuildStore((state) => state.setFocusedLineage);

  if (focusedLineage.length === 0) {
    return <></>;
  }

  const handleBreadcrumbClick = (index: number): void => {
    // Navigate to that level by slicing the lineage
    setFocusedLineage(focusedLineage.slice(0, index + 1));
  };

  return (
    <Paper sx={{ padding: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      {focusedLineage.map((item, index) => {
        const template = templates[item.templateId];
        const isLast = index === focusedLineage.length - 1;
        const label = item.offset !== undefined
          ? `${template?.intent || item.templateId} [${formatDuration(item.offset)}]`
          : template?.intent || item.templateId;

        return (
          <React.Fragment key={index}>
            <Chip
              label={label}
              onClick={(): void => handleBreadcrumbClick(index)}
              color={isLast ? 'primary' : 'default'}
              clickable={!isLast}
              sx={{
                fontWeight: isLast ? 600 : 400,
                cursor: isLast ? 'default' : 'pointer',
              }}
            />
            {!isLast && (
              <Box component="span" sx={{ color: 'text.secondary' }}>
                <ChevronRightIcon fontSize="small" />
              </Box>
            )}
          </React.Fragment>
        );
      })}
    </Paper>
  );
}
