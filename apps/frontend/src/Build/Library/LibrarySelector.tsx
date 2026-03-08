/**
 * Library Selector component for adding a template to a library
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
import React, { useState, useMemo, useEffect } from 'react';

import { useBuildStore } from '../store';

interface LibrarySelectorProps {
  open: boolean;
  onClose: () => void;
  templateId: string;
}

export function LibrarySelector({
  open,
  onClose,
  templateId,
}: LibrarySelectorProps): React.ReactElement {
  const libraries = useBuildStore((state) => state.libraries);
  const addTemplateToLibrary = useBuildStore((state) => state.addTemplateToLibrary);
  const loadLibraries = useBuildStore((state) => state.loadLibraries);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadLibraries();
    }
  }, [open, loadLibraries]);

  // Filter libraries by search query
  const availableLibraries = useMemo(() => {
    const libraryArray = Object.values(libraries);
    if (!searchQuery) {
      return libraryArray;
    }
    return libraryArray.filter((library) => library.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [libraries, searchQuery]);

  const handleLibraryClick = (libraryId: string): void => {
    setSelectedLibraryId(libraryId);
  };

  const handleAdd = async (): Promise<void> => {
    if (!selectedLibraryId) {
      return;
    }

    try {
      await addTemplateToLibrary(selectedLibraryId, templateId);
      setSelectedLibraryId(null);
      setSearchQuery('');
      onClose();
    } catch (error) {
      // Error is already handled in store with notifications
      // eslint-disable-next-line no-console
      console.error('Failed to add template to library:', error);
    }
  };

  const handleClose = (): void => {
    setSelectedLibraryId(null);
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Add to Library</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          label="Search libraries"
          value={searchQuery}
          onChange={(e): void => setSearchQuery(e.target.value)}
          margin="normal"
          autoFocus
        />

        {availableLibraries.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'No libraries match your search' : 'No libraries yet. Create one first!'}
            </Typography>
          </Box>
        )}

        {availableLibraries.length > 0 && (
          <List>
            {availableLibraries.map((library) => (
              <ListItem key={library.id} disablePadding>
                <ListItemButton
                  selected={selectedLibraryId === library.id}
                  onClick={(): void => handleLibraryClick(library.id)}
                >
                  <ListItemText
                    primary={library.name}
                    secondary={library.description || `${library.templateCount} templates`}
                  />
                  {selectedLibraryId === library.id && (
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
          disabled={!selectedLibraryId}
        >
          Add to Library
        </Button>
      </DialogActions>
    </Dialog>
  );
}
