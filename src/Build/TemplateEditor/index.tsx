import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import React from 'react';

import { useBuildStore } from '../store';

import { BaseTemplateSelectionModal } from './BaseTemplateSelectionModal';
import { Breadcrumbs } from './Breadcrumbs';
import { HierarchyViewer } from './HierarchyViewer';
import { PropertiesPanel } from './PropertiesPanel';
import { SegmentAddModal } from './SegmentAddModal';
import { SegmentAddOverlay } from './SegmentAddOverlay';

export function TemplateEditor(): React.ReactElement {
  const isTemplateEditorOpen = useBuildStore((state) => state.isTemplateEditorOpen);
  const openBaseTemplateSelection = useBuildStore((state) => state.openBaseTemplateSelection);
  const closeTemplateEditor = useBuildStore((state) => state.closeTemplateEditor);

  if (!isTemplateEditorOpen) {
    return <></>;
  }

  const handleBack = (): void => {
    closeTemplateEditor();
  };

  const handleChangeBaseTemplate = (): void => {
    openBaseTemplateSelection();
  };

  return (
    <>
      <Box
        sx={{
          height: 'calc(100vh - 120px)', // Account for AppBar (64px) + bottom navigation (56px)
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleBack}
              aria-label="Back to library"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography sx={{ marginLeft: 2, flex: 1 }} variant="h6" component="div">
              Template Editor
            </Typography>
          </Toolbar>
        </AppBar>

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
            paddingBottom: 8, // Add padding for sticky footer
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

        <Paper
          sx={{
            position: 'fixed',
            bottom: 56, // Above bottom navigation
            left: 0,
            right: 0,
            padding: 2,
            borderTop: 1,
            borderColor: 'divider',
            zIndex: 1,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<SwapHorizIcon />}
            onClick={handleChangeBaseTemplate}
            fullWidth
          >
            Change Base Template
          </Button>
        </Paper>
      </Box>

      <SegmentAddModal />
      <SegmentAddOverlay />
      <BaseTemplateSelectionModal />
    </>
  );
}
