import CloseIcon from '@mui/icons-material/Close';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import React from 'react';

import { TemplateCard } from '../../Library/TemplateCard';
import { useBuildStore } from '../../store';

export function BaseTemplateSelectionModal(): React.ReactElement {
  const isBaseTemplateSelectionOpen = useBuildStore((state) => state.isBaseTemplateSelectionOpen);
  const templates = useBuildStore((state) => state.templates);
  const closeBaseTemplateSelection = useBuildStore((state) => state.closeBaseTemplateSelection);
  const selectBaseTemplate = useBuildStore((state) => state.selectBaseTemplate);

  const templateArray = Object.values(templates);

  const handleClose = (): void => {
    closeBaseTemplateSelection();
  };

  const handleSelect = (templateId: string): void => {
    selectBaseTemplate(templateId);
  };

  return (
    <Dialog fullScreen open={isBaseTemplateSelectionOpen} onClose={handleClose}>
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ marginLeft: 2, flex: 1 }} variant="h6" component="div">
            Select Base Template
          </Typography>
        </Toolbar>
      </AppBar>

      <DialogContent>
        <Container maxWidth="md" sx={{ paddingTop: 3, paddingBottom: 3 }}>
          {templateArray.length === 0 && (
            <Box sx={{ textAlign: 'center', paddingTop: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No templates available. Create a template first.
              </Typography>
            </Box>
          )}

          {templateArray.length > 0 && (
            <Box>
              {templateArray.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  selectionMode
                  onSelect={handleSelect}
                />
              ))}
            </Box>
          )}
        </Container>
      </DialogContent>
    </Dialog>
  );
}
