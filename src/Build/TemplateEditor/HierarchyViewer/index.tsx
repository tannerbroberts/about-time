import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import type { Template } from '@tannerbroberts/about-time-core';
import React from 'react';

import { useBuildStore } from '../../store';

import { DepthControls } from './DepthControls';
import { EmptyState } from './EmptyState';
import { Ruler } from './Ruler';
import { Segment } from './Segment';
import { ZoomControls } from './ZoomControls';

export function HierarchyViewer(): React.ReactElement {
  const selectedBaseTemplateId = useBuildStore((state) => state.selectedBaseTemplateId);
  const zoomLevel = useBuildStore((state) => state.zoomLevel);
  const templates = useBuildStore((state) => state.templates);
  const closeTemplateEditor = useBuildStore((state) => state.closeTemplateEditor);

  const baseTemplate = selectedBaseTemplateId
    ? (templates[selectedBaseTemplateId] as Template | undefined)
    : undefined;

  const handleChooseTemplate = (): void => {
    closeTemplateEditor();
  };

  if (!baseTemplate) {
    return <EmptyState onChooseTemplate={handleChooseTemplate} />;
  }

  const innerWidth = `${97 * zoomLevel}%`;

  return (
    <Stack spacing={2} sx={{ height: '100%', padding: 2 }}>
      <Paper sx={{ padding: 2, display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        <ZoomControls />
        <DepthControls />
      </Paper>

      <Paper
        sx={{
          flex: 1,
          position: 'relative',
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: 2,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: innerWidth,
            minWidth: '100%',
            height: '100%',
            paddingBottom: '40px', // Space for ruler
          }}
        >
          <Segment
            templateId={baseTemplate.id}
            offset={0}
            depth={0}
            lineage={[{ templateId: baseTemplate.id }]}
            baseDuration={baseTemplate.estimatedDuration}
          />

          <Ruler duration={baseTemplate.estimatedDuration} />
        </Box>
      </Paper>
    </Stack>
  );
}
