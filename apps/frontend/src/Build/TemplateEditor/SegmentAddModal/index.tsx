import CloseIcon from '@mui/icons-material/Close';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import type { LaneTemplate, Template } from '@tannerbroberts/about-time-core';
import React, { useEffect, useState, useMemo } from 'react';

import { TemplateCard } from '../../Library/TemplateCard';
import { useBuildStore } from '../../store';
import { wouldCreateCircularDependency } from '../../utils/circularDependency';

export function SegmentAddModal(): React.ReactElement {
  const isSegmentAddModalOpen = useBuildStore((state) => state.isSegmentAddModalOpen);
  const selectedRegion = useBuildStore((state) => state.selectedRegion);
  const focusedLineage = useBuildStore((state) => state.focusedLineage);
  const templates = useBuildStore((state) => state.templates);
  const libraries = useBuildStore((state) => state.libraries);
  const libraryTemplates = useBuildStore((state) => state.libraryTemplates);
  const closeSegmentAddModal = useBuildStore((state) => state.closeSegmentAddModal);
  const updateTemplate = useBuildStore((state) => state.updateTemplate);
  const toggleAddSegmentMode = useBuildStore((state) => state.toggleAddSegmentMode);
  const loadLibraries = useBuildStore((state) => state.loadLibraries);
  const loadLibraryTemplates = useBuildStore((state) => state.loadLibraryTemplates);

  const [selectedLibraryId, setSelectedLibraryId] = useState<string>('all');

  // Load libraries when modal opens
  useEffect(() => {
    if (isSegmentAddModalOpen) {
      loadLibraries();
    }
  }, [isSegmentAddModalOpen, loadLibraries]);

  // Load templates for selected library
  useEffect(() => {
    if (selectedLibraryId !== 'all' && selectedLibraryId) {
      loadLibraryTemplates(selectedLibraryId);
    }
  }, [selectedLibraryId, loadLibraryTemplates]);

  const handleClose = (): void => {
    setSelectedLibraryId('all');
    closeSegmentAddModal();
  };

  const handleLibraryChange = (libraryId: string): void => {
    setSelectedLibraryId(libraryId);
  };

  const handleTemplateSelect = (templateId: string): void => {
    if (!selectedRegion || focusedLineage.length === 0) {
      return;
    }

    const focusedItem = focusedLineage[focusedLineage.length - 1];
    const focusedTemplate = templates[focusedItem.templateId] as Template;

    if (!focusedTemplate || focusedTemplate.templateType !== 'lane') {
      return;
    }

    const laneTemplate = focusedTemplate as LaneTemplate;

    // Create new segment
    const newSegment = {
      templateId,
      offset: selectedRegion.start,
      relationshipId: crypto.randomUUID(),
    };

    // Add to focused template's segments array
    const updatedSegments = [...laneTemplate.segments, newSegment];

    updateTemplate(laneTemplate.id, {
      ...laneTemplate,
      segments: updatedSegments,
    });

    // Close modal and exit add segment mode
    closeSegmentAddModal();
    toggleAddSegmentMode();
  };

  const libraryArray = Object.values(libraries);

  // Get base template list based on library selection
  const baseTemplates = useMemo(() => {
    if (selectedLibraryId === 'all') {
      return Object.values(templates);
    }
    return libraryTemplates[selectedLibraryId] || [];
  }, [templates, selectedLibraryId, libraryTemplates]);

  // Filter templates based on criteria
  const filteredTemplates = useMemo(() => {
    if (!selectedRegion || focusedLineage.length === 0) {
      return [];
    }

    const focusedItem = focusedLineage[focusedLineage.length - 1];
    const regionDuration = selectedRegion.end - selectedRegion.start;

    return baseTemplates.filter((template) => {
      // Filter by duration - template must fit in the region
      if (template.estimatedDuration > regionDuration) {
        return false;
      }

      // Filter by circular dependency
      if (wouldCreateCircularDependency(focusedItem.templateId, template.id, templates)) {
        return false;
      }

      return true;
    });
  }, [baseTemplates, selectedRegion, focusedLineage, templates]);

  return (
    <Dialog fullScreen open={isSegmentAddModalOpen} onClose={handleClose}>
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ marginLeft: 2, flex: 1 }} variant="h6" component="div">
            Add Segment
          </Typography>
        </Toolbar>
      </AppBar>

      <DialogContent>
        <Box sx={{ maxWidth: 800, margin: '0 auto', paddingTop: 2 }}>
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

          {filteredTemplates.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', marginTop: 4 }}>
              No templates available that fit in the selected region
            </Typography>
          )}

          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selectionMode
              onSelect={handleTemplateSelect}
              showLibraryBadgesInSelection={selectedLibraryId === 'all'}
            />
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
