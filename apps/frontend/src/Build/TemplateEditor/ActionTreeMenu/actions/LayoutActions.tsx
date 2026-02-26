import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  distributeSegmentOffsetsByInterval,
  equallyDistributeSegments,
  fitLaneDurationToLast,
  packSegments,
} from '@tannerbroberts/about-time-core';
import type { LaneTemplate, Template } from '@tannerbroberts/about-time-core';
import { AnimatePresence } from 'framer-motion';
import React from 'react';

import { useBuildStore } from '../../../store';
import { formatDuration } from '../../../utils/durationFormatters';
import { calculateFitToContentDuration } from '../../../utils/layoutHelpers';
import { NOTIFICATION_DURATIONS, NOTIFICATION_MESSAGES } from '../../../utils/notifications';
import { ActionLeaf } from '../ActionLeaf';
import { ConnectionLine } from '../ConnectionLine';
import type { Position } from '../types';
import type { ActionAvailability } from '../useContextActions';
import { calculateNodePosition, distributeAngles } from '../utils/positioning';

export interface LayoutActionsProps {
  availability: ActionAvailability;
  parentPosition: Position;
  parentAngle: number;
  color: string;
}

export function LayoutActions({ availability, parentPosition, parentAngle, color }: LayoutActionsProps): React.ReactElement {
  const focusedLineage = useBuildStore((state) => state.focusedLineage);
  const templates = useBuildStore((state) => state.templates);
  const updateTemplate = useBuildStore((state) => state.updateTemplate);
  const showNotification = useBuildStore((state) => state.showNotification);

  const [gapDialogOpen, setGapDialogOpen] = React.useState(false);
  const [gapValue, setGapValue] = React.useState('60000'); // Default 1 minute in ms

  const [fitToContentDialogOpen, setFitToContentDialogOpen] = React.useState(false);
  const [proposedDuration, setProposedDuration] = React.useState<number>(0);

  const focusedItem = focusedLineage[focusedLineage.length - 1];
  const template = templates[focusedItem?.templateId] as LaneTemplate | undefined;

  const handlePackTightly = (): void => {
    if (!template) {
      return;
    }
    const result = packSegments(template.id, templates as Record<string, Template>);
    if (result) {
      updateTemplate(template.id, result);
      showNotification(NOTIFICATION_MESSAGES.LAYOUT_PACK_TIGHTLY, 'success', NOTIFICATION_DURATIONS.SHORT);
    }
  };

  const handleDistributeEvenly = (): void => {
    if (!template) {
      return;
    }
    const result = equallyDistributeSegments(template.id, templates as Record<string, Template>);
    if (result) {
      updateTemplate(template.id, result);
      showNotification(NOTIFICATION_MESSAGES.LAYOUT_DISTRIBUTE_EVENLY, 'success', NOTIFICATION_DURATIONS.SHORT);
    }
  };

  const handleFitToContent = (): void => {
    if (!template) {
      return;
    }
    // Calculate what the new duration would be
    const newDuration = calculateFitToContentDuration(template, templates as Record<string, Template>);

    // Handle edge case: no segments
    if (newDuration === null || newDuration === 0) {
      showNotification('Cannot fit to content: no segments found', 'info', NOTIFICATION_DURATIONS.SHORT);
      return;
    }

    // Check if duration would change
    if (newDuration !== template.estimatedDuration) {
      // Duration will change - show confirmation dialog
      setProposedDuration(newDuration);
      setFitToContentDialogOpen(true);
    } else {
      // Duration unchanged - apply immediately
      const result = fitLaneDurationToLast(template.id, templates as Record<string, Template>);
      if (result) {
        updateTemplate(template.id, result);
        showNotification(NOTIFICATION_MESSAGES.LAYOUT_FIT_TO_CONTENT, 'success', NOTIFICATION_DURATIONS.SHORT);
      }
    }
  };

  const handleFitToContentConfirm = (): void => {
    if (!template) {
      return;
    }
    const result = fitLaneDurationToLast(template.id, templates as Record<string, Template>);
    if (result) {
      updateTemplate(template.id, result);
      showNotification(NOTIFICATION_MESSAGES.LAYOUT_FIT_TO_CONTENT, 'success', NOTIFICATION_DURATIONS.SHORT);
    }
    setFitToContentDialogOpen(false);
  };

  const handleFitToContentCancel = (): void => {
    setFitToContentDialogOpen(false);
  };

  const handleAddGapOpen = (): void => {
    setGapDialogOpen(true);
  };

  const handleAddGapClose = (): void => {
    setGapDialogOpen(false);
  };

  const handleAddGapConfirm = (): void => {
    if (!template) {
      return;
    }
    const gapMs = parseInt(gapValue, 10);
    if (Number.isNaN(gapMs) || gapMs < 0) {
      showNotification('Invalid gap value. Please enter a positive number.', 'error', NOTIFICATION_DURATIONS.SHORT);
      return;
    }

    const result = distributeSegmentOffsetsByInterval(template.id, gapMs, templates as Record<string, Template>);
    if (result) {
      updateTemplate(template.id, result);
      showNotification(NOTIFICATION_MESSAGES.LAYOUT_ADD_GAP(gapMs), 'success', NOTIFICATION_DURATIONS.SHORT);
    }
    setGapDialogOpen(false);
  };

  const children = ['Pack', 'Distribute', 'Fit', 'Add Gap'];
  const angles = distributeAngles(children.length, parentAngle, 80);
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
          <ConnectionLine key="line-pack" from={parentPosition} to={positions[0]} color={color} animate />
          <ConnectionLine key="line-distribute" from={parentPosition} to={positions[1]} color={color} animate />
          <ConnectionLine key="line-fit" from={parentPosition} to={positions[2]} color={color} animate />
          <ConnectionLine key="line-add-gap" from={parentPosition} to={positions[3]} color={color} animate />
        </AnimatePresence>
      </svg>

      {/* HTML nodes */}
      <AnimatePresence>
        <ActionLeaf
          key="leaf-pack"
          label="Pack"
          onClick={handlePackTightly}
          disabled={!availability.canUseLayout}
          disabledTooltip={availability.layoutDisabledReason}
          position={positions[0]}
          color={color}
        />
        <ActionLeaf
          key="leaf-distribute"
          label="Distribute"
          onClick={handleDistributeEvenly}
          disabled={!availability.canUseLayout}
          disabledTooltip={availability.layoutDisabledReason}
          position={positions[1]}
          color={color}
        />
        <ActionLeaf
          key="leaf-fit"
          label="Fit"
          onClick={handleFitToContent}
          disabled={!availability.canUseLayout}
          disabledTooltip={availability.layoutDisabledReason}
          position={positions[2]}
          color={color}
        />
        <ActionLeaf
          key="leaf-add-gap"
          label="Add Gap"
          onClick={handleAddGapOpen}
          disabled={!availability.canUseLayout}
          disabledTooltip={availability.layoutDisabledReason}
          position={positions[3]}
          color={color}
        />
      </AnimatePresence>

      <Dialog open={gapDialogOpen} onClose={handleAddGapClose}>
        <DialogTitle>Add Gap Between Segments</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Gap size (milliseconds)"
            type="number"
            fullWidth
            value={gapValue}
            onChange={(e): void => setGapValue(e.target.value)}
            helperText="Enter the gap size in milliseconds (e.g., 60000 for 1 minute)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddGapClose}>Cancel</Button>
          <Button onClick={handleAddGapConfirm} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {template && (
        <Dialog open={fitToContentDialogOpen} onClose={handleFitToContentCancel}>
          <DialogTitle>Confirm Duration Change</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              This operation will change the template duration:
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2">
                <strong>Current duration:</strong> {formatDuration(template.estimatedDuration)}
              </Typography>
              <Typography variant="body2">
                <strong>New duration:</strong> {formatDuration(proposedDuration)}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleFitToContentCancel}>Cancel</Button>
            <Button onClick={handleFitToContentConfirm} variant="contained">
              Proceed
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
