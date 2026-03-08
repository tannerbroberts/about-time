/**
 * Library Form component for creating and editing libraries
 */

import type { LibraryVisibility } from '@about-time/types/library';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import React, { useState } from 'react';

import { useBuildStore } from '../store';

export function LibraryForm(): React.ReactElement {
  const isOpen = useBuildStore((state) => state.isLibraryFormOpen);
  const editingLibraryId = useBuildStore((state) => state.editingLibraryId);
  const libraries = useBuildStore((state) => state.libraries);
  const closeLibraryForm = useBuildStore((state) => state.closeLibraryForm);
  const createLibrary = useBuildStore((state) => state.createLibrary);
  const updateLibrary = useBuildStore((state) => state.updateLibrary);

  const isEditing = !!editingLibraryId;
  const editingLibrary = editingLibraryId ? libraries[editingLibraryId] : null;

  // Use a key to force remount when switching between create/edit
  const formKey = isOpen ? (editingLibraryId || 'create') : 'closed';

  const [name, setName] = useState(editingLibrary?.name || '');
  const [description, setDescription] = useState(editingLibrary?.description || '');
  const [visibility, setVisibility] = useState<LibraryVisibility>(editingLibrary?.visibility || 'private');

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    try {
      if (isEditing && editingLibraryId) {
        await updateLibrary(editingLibraryId, name, description || undefined);
      } else {
        await createLibrary(name, description || undefined);
      }
    } catch (error) {
      // Error is already handled in store with notifications
      console.error('Failed to save library:', error);
    }
  };

  const handleClose = (): void => {
    closeLibraryForm();
  };

  return (
    <Dialog key={formKey} open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? 'Edit Library' : 'Create Library'}
        </DialogTitle>

        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Name"
            value={name}
            onChange={(e): void => setName(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e): void => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Visibility</InputLabel>
            <Select
              value={visibility}
              onChange={(e): void => setVisibility(e.target.value as LibraryVisibility)}
              label="Visibility"
            >
              <MenuItem value="private">Private</MenuItem>
              <MenuItem value="unlisted">Unlisted</MenuItem>
              <MenuItem value="public">Public</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
