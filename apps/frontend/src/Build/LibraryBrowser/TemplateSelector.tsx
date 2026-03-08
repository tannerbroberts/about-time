/**
 * Template Selector component for adding templates to a library
 */

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useState, useMemo } from 'react';

import { useBuildStore } from '../store';

interface TemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  libraryId: string;
}

export function TemplateSelector({
  open,
  onClose,
  libraryId,
}: TemplateSelectorProps): React.ReactElement {
  const templates = useBuildStore((state) => state.templates);
  const libraryTemplates = useBuildStore((state) => state.libraryTemplates[libraryId] || []);
  const addTemplateToLibrary = useBuildStore((state) => state.addTemplateToLibrary);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Get IDs of templates already in the library
  const libraryTemplateIds = useMemo(
    () => new Set(libraryTemplates.map((t) => t.id)),
    [libraryTemplates],
  );

  // Filter templates: not already in library and match search query
  const availableTemplates = useMemo(() => {
    const templateArray = Object.values(templates);
    return templateArray.filter((template) => {
      if (libraryTemplateIds.has(template.id)) {
        return false;
      }
      if (searchQuery && !template.intent.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [templates, libraryTemplateIds, searchQuery]);

  const handleTemplateClick = (templateId: string): void => {
    setSelectedTemplateId(templateId);
  };

  const handleAdd = async (): Promise<void> => {
    if (!selectedTemplateId) {
      return;
    }

    try {
      await addTemplateToLibrary(libraryId, selectedTemplateId);
      setSelectedTemplateId(null);
      setSearchQuery('');
      onClose();
    } catch (error) {
      // Error is already handled in store with notifications
      console.error('Failed to add template:', error);
    }
  };

  const handleClose = (): void => {
    setSelectedTemplateId(null);
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Add Template to Library</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          label="Search templates"
          value={searchQuery}
          onChange={(e): void => setSearchQuery(e.target.value)}
          margin="normal"
          autoFocus
        />

        {availableTemplates.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'No templates match your search' : 'All templates are already in this library'}
            </Typography>
          </Box>
        )}

        {availableTemplates.length > 0 && (
          <List>
            {availableTemplates.map((template) => (
              <ListItem key={template.id} disablePadding>
                <ListItemButton
                  selected={selectedTemplateId === template.id}
                  onClick={(): void => handleTemplateClick(template.id)}
                >
                  <ListItemText
                    primary={template.intent}
                    secondary={template.templateType === 'busy' ? 'Busy Template' : 'Lane Template'}
                  />
                  {selectedTemplateId === template.id && (
                    <CheckCircleIcon color="primary" />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleAdd}
          variant="contained"
          disabled={!selectedTemplateId}
        >
          Add to Library
        </Button>
      </DialogActions>
    </Dialog>
  );
}
