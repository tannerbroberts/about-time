import { Box, Button, Stack, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import {
  packSegments,
  equallyDistributeSegments,
  fitLaneDurationToLast,
  distributeSegmentOffsetsByInterval,
} from '@tannerbroberts/about-time-core';
import type { LaneTemplate, Template } from '@tannerbroberts/about-time-core';
import React from 'react';

import { useBuildStore } from '../../store';
import { NOTIFICATION_DURATIONS, NOTIFICATION_MESSAGES } from '../../utils/notifications';

interface LayoutButtonsProps {
  template: LaneTemplate;
}

export function LayoutButtons({ template }: LayoutButtonsProps): React.ReactElement {
  const templates = useBuildStore((state) => state.templates);
  const updateTemplate = useBuildStore((state) => state.updateTemplate);
  const showNotification = useBuildStore((state) => state.showNotification);

  const [gapDialogOpen, setGapDialogOpen] = React.useState(false);
  const [gapValue, setGapValue] = React.useState('60000'); // Default 1 minute in ms

  const handlePackTightly = (): void => {
    const result = packSegments(template.id, templates as Record<string, Template>);
    if (result) {
      updateTemplate(template.id, result);
      showNotification(NOTIFICATION_MESSAGES.LAYOUT_PACK_TIGHTLY, 'success', NOTIFICATION_DURATIONS.SHORT);
    }
  };

  const handleDistributeEvenly = (): void => {
    const result = equallyDistributeSegments(template.id, templates as Record<string, Template>);
    if (result) {
      updateTemplate(template.id, result);
      showNotification(NOTIFICATION_MESSAGES.LAYOUT_DISTRIBUTE_EVENLY, 'success', NOTIFICATION_DURATIONS.SHORT);
    }
  };

  const handleFitToContent = (): void => {
    const result = fitLaneDurationToLast(template.id, templates as Record<string, Template>);
    if (result) {
      updateTemplate(template.id, result);
      showNotification(NOTIFICATION_MESSAGES.LAYOUT_FIT_TO_CONTENT, 'success', NOTIFICATION_DURATIONS.SHORT);
    }
  };

  const handleAddGapOpen = (): void => {
    setGapDialogOpen(true);
  };

  const handleAddGapClose = (): void => {
    setGapDialogOpen(false);
  };

  const handleAddGapConfirm = (): void => {
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

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ mb: 1, fontWeight: 600, fontSize: '0.875rem' }}>Layout Operations</Box>
      <Stack spacing={1}>
        <Button variant="outlined" size="small" onClick={handlePackTightly} fullWidth>
          Pack Tightly
        </Button>
        <Button variant="outlined" size="small" onClick={handleDistributeEvenly} fullWidth>
          Distribute Evenly
        </Button>
        <Button variant="outlined" size="small" onClick={handleFitToContent} fullWidth>
          Fit to Content
        </Button>
        <Button variant="outlined" size="small" onClick={handleAddGapOpen} fullWidth>
          Add Gap...
        </Button>
      </Stack>

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
    </Box>
  );
}
