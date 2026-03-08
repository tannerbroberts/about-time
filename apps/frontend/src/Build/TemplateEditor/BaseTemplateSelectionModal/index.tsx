import CloseIcon from '@mui/icons-material/Close';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState, useMemo } from 'react';

import { TemplateCard } from '../../Library/TemplateCard';
import { useBuildStore } from '../../store';

export function BaseTemplateSelectionModal(): React.ReactElement {
  const isBaseTemplateSelectionOpen = useBuildStore((state) => state.isBaseTemplateSelectionOpen);
  const templates = useBuildStore((state) => state.templates);
  const libraries = useBuildStore((state) => state.libraries);
  const libraryTemplates = useBuildStore((state) => state.libraryTemplates);
  const closeBaseTemplateSelection = useBuildStore((state) => state.closeBaseTemplateSelection);
  const selectBaseTemplate = useBuildStore((state) => state.selectBaseTemplate);
  const loadLibraries = useBuildStore((state) => state.loadLibraries);
  const loadLibraryTemplates = useBuildStore((state) => state.loadLibraryTemplates);

  const [selectedLibraryId, setSelectedLibraryId] = useState<string>('all');

  // Load libraries when modal opens
  useEffect(() => {
    if (isBaseTemplateSelectionOpen) {
      loadLibraries();
    }
  }, [isBaseTemplateSelectionOpen, loadLibraries]);

  // Load templates for selected library
  useEffect(() => {
    if (selectedLibraryId !== 'all' && selectedLibraryId) {
      loadLibraryTemplates(selectedLibraryId);
    }
  }, [selectedLibraryId, loadLibraryTemplates]);

  // Filter templates based on selected library
  const templateArray = useMemo(() => {
    if (selectedLibraryId === 'all') {
      return Object.values(templates);
    }

    // Get templates from the selected library
    const libTemplates = libraryTemplates[selectedLibraryId] || [];
    return libTemplates;
  }, [templates, selectedLibraryId, libraryTemplates]);

  const libraryArray = Object.values(libraries);

  const handleClose = (): void => {
    setSelectedLibraryId('all');
    closeBaseTemplateSelection();
  };

  const handleSelect = (templateId: string): void => {
    selectBaseTemplate(templateId);
  };

  const handleLibraryChange = (libraryId: string): void => {
    setSelectedLibraryId(libraryId);
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
          <Box sx={{ marginBottom: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Filter by Library</InputLabel>
              <Select
                value={selectedLibraryId}
                onChange={(e): void => handleLibraryChange(e.target.value)}
                label="Filter by Library"
              >
                <MenuItem value="all">All Templates</MenuItem>
                {libraryArray.map((library) => (
                  <MenuItem key={library.id} value={library.id}>
                    {library.name} ({library.templateCount} templates)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

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
                  showLibraryBadgesInSelection={selectedLibraryId === 'all'}
                />
              ))}
            </Box>
          )}
        </Container>
      </DialogContent>
    </Dialog>
  );
}
