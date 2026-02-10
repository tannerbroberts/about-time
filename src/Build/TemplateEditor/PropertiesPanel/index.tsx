import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { BusyTemplate, Template } from '@tannerbroberts/about-time-core';
import React from 'react';

import { useBuildStore } from '../../store';

import { ActionButtons } from './ActionButtons';
import { BusyProperties } from './BusyProperties';
import { InstanceCounterBadge } from './InstanceCounterBadge';
import { SegmentProperties } from './SegmentProperties';
import { TemplateProperties } from './TemplateProperties';

export function PropertiesPanel(): React.ReactElement {
  const focusedLineage = useBuildStore((state) => state.focusedLineage);
  const templates = useBuildStore((state) => state.templates);

  if (focusedLineage.length === 0) {
    return (
      <Paper sx={{ padding: 3, height: '100%' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          Select a template or segment to view properties
        </Typography>
      </Paper>
    );
  }

  const focusedItem = focusedLineage[focusedLineage.length - 1];
  const template = templates[focusedItem.templateId] as Template | undefined;

  if (!template) {
    return (
      <Paper sx={{ padding: 3, height: '100%' }}>
        <Typography variant="body2" color="error">
          Template not found
        </Typography>
      </Paper>
    );
  }

  const isBaseTemplate = focusedItem.offset === undefined;
  const parentLineage = focusedLineage.slice(0, -1);

  return (
    <Paper sx={{ padding: 3, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          {isBaseTemplate ? 'Base Template Properties' : 'Segment Properties'}
        </Typography>
        <InstanceCounterBadge templateId={template.id} currentLineage={focusedLineage} />
      </Box>

      <Divider />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TemplateProperties template={template} />

        {!isBaseTemplate && (
          <SegmentProperties focusedItem={focusedItem} parentLineage={parentLineage} />
        )}

        {template.templateType === 'busy' && (
          <BusyProperties template={template as BusyTemplate} />
        )}
      </Box>

      <Divider />

      <ActionButtons template={template} focusedItem={focusedItem} parentLineage={parentLineage} />
    </Paper>
  );
}
