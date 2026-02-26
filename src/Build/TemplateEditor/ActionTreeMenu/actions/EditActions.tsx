import Button from '@mui/material/Button';
import type { LaneTemplate, Template } from '@tannerbroberts/about-time-core';
import { AnimatePresence } from 'framer-motion';
import React from 'react';

import { useBuildStore } from '../../../store';
import { NOTIFICATION_DURATIONS, NOTIFICATION_MESSAGES } from '../../../utils/notifications';
import { ActionLeaf } from '../ActionLeaf';
import { ConnectionLine } from '../ConnectionLine';
import type { Position } from '../types';
import type { ActionAvailability } from '../useContextActions';
import { calculateNodePosition, distributeAngles } from '../utils/positioning';

export interface EditActionsProps {
  availability: ActionAvailability;
  parentPosition: Position;
  parentAngle: number;
  color: string;
}

export function EditActions({ availability, parentPosition, parentAngle, color }: EditActionsProps): React.ReactElement {
  const focusedLineage = useBuildStore((state) => state.focusedLineage);
  const templates = useBuildStore((state) => state.templates);
  const createTemplate = useBuildStore((state) => state.createTemplate);
  const updateTemplate = useBuildStore((state) => state.updateTemplate);
  const setFocusedLineage = useBuildStore((state) => state.setFocusedLineage);
  const showNotification = useBuildStore((state) => state.showNotification);
  const openTemplateForm = useBuildStore((state) => state.openTemplateForm);

  const focusedItem = focusedLineage[focusedLineage.length - 1];
  const template = templates[focusedItem?.templateId];
  const parentLineage = focusedLineage.slice(0, -1);

  const handleDuplicate = (): void => {
    if (!template) {
      return;
    }

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

  const handleRemoveSegment = (): void => {
    if (!availability.canRemoveSegment || !focusedItem) {
      return;
    }

    const parentItem = parentLineage[parentLineage.length - 1];
    if (!parentItem) {
      return;
    }

    const parentTemplate = templates[parentItem.templateId] as LaneTemplate;
    if (!parentTemplate || parentTemplate.templateType !== 'lane') {
      return;
    }

    if (window.confirm('Are you sure you want to delete this segment?')) {
      // Remove this segment from parent's segments array
      const updatedSegments = parentTemplate.segments.filter(
        (segment) => !(segment.templateId === focusedItem.templateId && segment.offset === focusedItem.offset),
      );

      updateTemplate(parentTemplate.id, {
        ...parentTemplate,
        segments: updatedSegments,
      });

      // Navigate back to parent
      setFocusedLineage(parentLineage);
    }
  };

  const children = ['Duplicate', 'Remove'];
  const angles = distributeAngles(children.length, parentAngle);
  const positions = angles.map((angle) => calculateNodePosition(angle, 140, parentPosition.x, parentPosition.y));

  return (
    <>
      {/* SVG layer for connection lines */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <AnimatePresence>
          <ConnectionLine key="line-duplicate" from={parentPosition} to={positions[0]} color={color} animate />
          <ConnectionLine key="line-remove" from={parentPosition} to={positions[1]} color={color} animate />
        </AnimatePresence>
      </svg>

      {/* HTML nodes */}
      <AnimatePresence>
        <ActionLeaf
          key="leaf-duplicate"
          label="Duplicate"
          onClick={handleDuplicate}
          disabled={!availability.canDuplicate}
          position={positions[0]}
          color={color}
        />
        <ActionLeaf
          key="leaf-remove"
          label="Remove"
          onClick={handleRemoveSegment}
          disabled={!availability.canRemoveSegment}
          disabledTooltip={availability.removeSegmentDisabledReason}
          position={positions[1]}
          color="#ef4444"
        />
      </AnimatePresence>
    </>
  );
}
