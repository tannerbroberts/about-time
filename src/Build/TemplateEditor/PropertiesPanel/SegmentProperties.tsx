import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import type { LaneTemplate, Template } from '@tannerbroberts/about-time-core';
import React from 'react';

import type { FocusPathItem } from '../../store';
import { useBuildStore } from '../../store';

export interface SegmentPropertiesProps {
  focusedItem: FocusPathItem;
  parentLineage: FocusPathItem[];
}

export function SegmentProperties({ focusedItem, parentLineage }: SegmentPropertiesProps): React.ReactElement {
  const templates = useBuildStore((state) => state.templates);
  const updateTemplate = useBuildStore((state) => state.updateTemplate);

  const [offsetMinutes, setOffsetMinutes] = React.useState(
    focusedItem.offset !== undefined ? Math.round(focusedItem.offset / 60000) : 0,
  );

  // Get the parent template to update its segments array
  const parentItem = parentLineage[parentLineage.length - 1];
  const parentTemplate = parentItem ? (templates[parentItem.templateId] as Template) : null;
  const isParentLane = parentTemplate?.templateType === 'lane';

  React.useEffect(() => {
    setOffsetMinutes(focusedItem.offset !== undefined ? Math.round(focusedItem.offset / 60000) : 0);
  }, [focusedItem.offset]);

  const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const minutes = parseInt(e.target.value, 10);
    if (!isNaN(minutes) && minutes >= 0 && parentTemplate && isParentLane) {
      setOffsetMinutes(minutes);

      const laneTemplate = parentTemplate as LaneTemplate;

      // Update the segment's offset in the parent template
      const updatedSegments = laneTemplate.segments.map((segment) => {
        // Find the segment that matches our focused item
        if (
          segment.templateId === focusedItem.templateId
          && segment.offset === focusedItem.offset
        ) {
          return { ...segment, offset: minutes * 60000 };
        }
        return segment;
      });

      updateTemplate(laneTemplate.id, {
        ...laneTemplate,
        segments: updatedSegments,
      });
    }
  };

  if (focusedItem.offset === undefined) {
    return <></>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Offset (minutes)"
        type="number"
        value={offsetMinutes}
        onChange={handleOffsetChange}
        fullWidth
        size="small"
        inputProps={{ min: 0 }}
        helperText="Time from start of parent template"
      />
    </Box>
  );
}
