import Box from '@mui/material/Box';
import React from 'react';

import { useBuildStore } from '../store';

import { Breadcrumbs } from './Breadcrumbs';
import { HierarchyViewer } from './HierarchyViewer';
import { PropertiesPanel } from './PropertiesPanel';
import { SegmentAddModal } from './SegmentAddModal';

export function TemplateEditor(): React.ReactElement {
  const isTemplateEditorOpen = useBuildStore((state) => state.isTemplateEditorOpen);

  if (!isTemplateEditorOpen) {
    return <></>;
  }

  return (
    <>
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ padding: 2 }}>
          <Breadcrumbs />
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            gap: 2,
            padding: 2,
            paddingTop: 0,
            overflow: 'hidden',
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          <Box sx={{ flex: { xs: 1, md: 7 }, minHeight: 0, overflow: 'hidden' }}>
            <HierarchyViewer />
          </Box>

          <Box sx={{ flex: { xs: 1, md: 3 }, minHeight: 0, overflow: 'hidden' }}>
            <PropertiesPanel />
          </Box>
        </Box>
      </Box>

      <SegmentAddModal />
    </>
  );
}
