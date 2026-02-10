import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import type { LaneTemplate, Template } from '@tannerbroberts/about-time-core';
import React from 'react';

import type { FocusPathItem } from '../../store';
import { useBuildStore } from '../../store';

export interface ActionButtonsProps {
  template: Template;
  focusedItem: FocusPathItem;
  parentLineage: FocusPathItem[];
}

export function ActionButtons({ template, focusedItem, parentLineage }: ActionButtonsProps): React.ReactElement {
  const templates = useBuildStore((state) => state.templates);
  const createTemplate = useBuildStore((state) => state.createTemplate);
  const updateTemplate = useBuildStore((state) => state.updateTemplate);
  const toggleAddSegmentMode = useBuildStore((state) => state.toggleAddSegmentMode);
  const setFocusedLineage = useBuildStore((state) => state.setFocusedLineage);

  const isSegment = focusedItem.offset !== undefined;
  const parentItem = parentLineage.length > 0 ? parentLineage[parentLineage.length - 1] : null;
  const parentTemplate = parentItem ? (templates[parentItem.templateId] as Template) : null;
  const isParentLane = parentTemplate?.templateType === 'lane';

  const handleAddSegment = (): void => {
    toggleAddSegmentMode();
  };

  const handleDuplicate = (): void => {
    const newId = crypto.randomUUID();
    const duplicatedTemplate: Template = {
      ...template,
      id: newId,
      intent: `${template.intent || 'Template'} (Copy)`,
    };
    createTemplate(duplicatedTemplate);
  };

  const handleDelete = (): void => {
    if (!parentItem || !isParentLane) {
      return;
    }

    if (window.confirm('Are you sure you want to delete this segment?')) {
      const laneTemplate = parentTemplate as LaneTemplate;

      // Remove this segment from parent's segments array
      const updatedSegments = laneTemplate.segments.filter(
        (segment) => !(segment.templateId === focusedItem.templateId && segment.offset === focusedItem.offset),
      );

      updateTemplate(laneTemplate.id, {
        ...laneTemplate,
        segments: updatedSegments,
      });

      // Navigate back to parent
      setFocusedLineage(parentLineage);
    }
  };

  const isLaneTemplate = template.templateType === 'lane';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {isLaneTemplate && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddSegment}
          fullWidth
        >
          Add Segment
        </Button>
      )}

      <Button
        variant="outlined"
        startIcon={<ContentCopyIcon />}
        onClick={handleDuplicate}
        fullWidth
      >
        Duplicate Template
      </Button>

      {isSegment && (
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDelete}
          fullWidth
        >
          Delete Segment
        </Button>
      )}
    </Box>
  );
}
