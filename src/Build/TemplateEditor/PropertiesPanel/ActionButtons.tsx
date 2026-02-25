import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import type { LaneTemplate, Template } from '@tannerbroberts/about-time-core';
import React from 'react';

import type { FocusPathItem } from '../../store';
import { useBuildStore } from '../../store';
import { NOTIFICATION_DURATIONS, NOTIFICATION_MESSAGES } from '../../utils/notifications';

export interface ActionButtonsProps {
  template: Template;
  focusedItem: FocusPathItem;
  parentLineage: FocusPathItem[];
}

export function ActionButtons({ template, focusedItem, parentLineage }: ActionButtonsProps): React.ReactElement {
  const templates = useBuildStore((state) => state.templates);
  const createTemplate = useBuildStore((state) => state.createTemplate);
  const updateTemplate = useBuildStore((state) => state.updateTemplate);
  const setFocusedLineage = useBuildStore((state) => state.setFocusedLineage);
  const showNotification = useBuildStore((state) => state.showNotification);
  const openTemplateForm = useBuildStore((state) => state.openTemplateForm);

  const isSegment = focusedItem.offset !== undefined;
  const parentItem = parentLineage.length > 0 ? parentLineage[parentLineage.length - 1] : null;
  const parentTemplate = parentItem ? (templates[parentItem.templateId] as Template) : null;
  const isParentLane = parentTemplate?.templateType === 'lane';

  const handleDuplicate = (): void => {
    const newId = crypto.randomUUID();
    const duplicatedTemplate: Template = {
      ...template,
      id: newId,
      intent: `${template.intent || 'Template'} (Copy)`,
    };
    createTemplate(duplicatedTemplate);

    // Create action button for editing the duplicate
    const editAction = (
      <Button
        color="inherit"
        size="small"
        onClick={(): void => {
          openTemplateForm(newId);
        }}
      >
        EDIT
      </Button>
    );

    // Show success notification with edit action
    showNotification(
      NOTIFICATION_MESSAGES.TEMPLATE_DUPLICATED(duplicatedTemplate.intent || 'Template'),
      'success',
      NOTIFICATION_DURATIONS.MEDIUM,
      editAction,
    );
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
