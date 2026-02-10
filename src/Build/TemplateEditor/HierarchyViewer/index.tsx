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
    <Stack spacing={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
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
          paddingBottom: '50px', // Space for ruler at bottom
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: innerWidth,
            minWidth: '100%',
            height: '100%',
          }}
        >
          <Segment
            templateId={baseTemplate.id}
            offset={0}
            depth={0}
            lineage={[{ templateId: baseTemplate.id }]}
            baseDuration={baseTemplate.estimatedDuration}
            cumulativeOffset={0}
          />
        </Box>

        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40px',
            backgroundColor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Ruler duration={baseTemplate.estimatedDuration} />
        </Box>
      </Paper>
    </Stack>
  );
}
