/**
 * Library Browser component for managing template libraries
 */

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import FolderIcon from '@mui/icons-material/Folder';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import React, { useEffect } from 'react';

import { useBuildStore } from '../store';

import { LibraryCard } from './LibraryCard';
import { LibraryDetail } from './LibraryDetail';
import { LibraryForm } from './LibraryForm';

export function LibraryBrowser(): React.ReactElement {
  const isOpen = useBuildStore((state) => state.isLibraryBrowserOpen);
  const closeLibraryBrowser = useBuildStore((state) => state.closeLibraryBrowser);
  const libraries = useBuildStore((state) => state.libraries);
  const selectedLibraryId = useBuildStore((state) => state.selectedLibraryId);
  const selectLibrary = useBuildStore((state) => state.selectLibrary);
  const openLibraryForm = useBuildStore((state) => state.openLibraryForm);
  const deleteLibrary = useBuildStore((state) => state.deleteLibrary);
  const loadLibraries = useBuildStore((state) => state.loadLibraries);

  useEffect(() => {
    if (isOpen) {
      loadLibraries();
    }
  }, [isOpen, loadLibraries]);

  const libraryArray = Object.values(libraries);
  const selectedLibrary = selectedLibraryId ? libraries[selectedLibraryId] : null;

  const handleLibraryClick = (libraryId: string): void => {
    selectLibrary(libraryId);
  };

  const handleLibraryEdit = (libraryId: string): void => {
    openLibraryForm(libraryId);
  };

  const handleLibraryDelete = async (libraryId: string): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this library? Templates will not be deleted.')) {
      await deleteLibrary(libraryId);
    }
  };

  const handleClose = (): void => {
    selectLibrary(null);
    closeLibraryBrowser();
  };

  const handleBackToList = (): void => {
    selectLibrary(null);
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            maxHeight: '800px',
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FolderIcon />
              <Typography variant="h6">
                {selectedLibrary ? selectedLibrary.name : 'My Libraries'}
              </Typography>
            </Box>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {!selectedLibrary && (
            <Box>
              {libraryArray.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No libraries yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create a library to organize your templates
                  </Typography>
                </Box>
              )}

              {libraryArray.length > 0 && (
                <List>
                  {libraryArray.map((library) => (
                    <LibraryCard
                      key={library.id}
                      library={library}
                      onClick={handleLibraryClick}
                      onEdit={handleLibraryEdit}
                      onDelete={handleLibraryDelete}
                    />
                  ))}
                </List>
              )}

              <Fab
                color="primary"
                aria-label="create library"
                sx={{
                  position: 'absolute',
                  bottom: 24,
                  right: 24,
                }}
                onClick={(): void => openLibraryForm()}
              >
                <AddIcon />
              </Fab>
            </Box>
          )}

          {selectedLibrary && (
            <LibraryDetail
              library={selectedLibrary}
              onBack={handleBackToList}
            />
          )}
        </DialogContent>
      </Dialog>

      <LibraryForm />
    </>
  );
}
