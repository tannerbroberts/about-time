import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useEffect } from 'react';

import { TemplateCard } from '../Library/TemplateCard';
import { useBuildStore } from '../store';

export function PublicLibrary(): React.ReactElement {
  const isOpen = useBuildStore((state) => state.isPublicLibraryOpen);
  const closePublicLibrary = useBuildStore((state) => state.closePublicLibrary);
  const publicTemplates = useBuildStore((state) => state.publicTemplates);
  const publicTemplateAuthors = useBuildStore((state) => state.publicTemplateAuthors);
  const publicSearchQuery = useBuildStore((state) => state.publicSearchQuery);
  const setPublicSearchQuery = useBuildStore((state) => state.setPublicSearchQuery);
  const importPublicTemplate = useBuildStore((state) => state.importPublicTemplate);
  const loadPublicTemplates = useBuildStore((state) => state.loadPublicTemplates);

  useEffect(() => {
    if (isOpen) {
      loadPublicTemplates();
    }
  }, [isOpen, loadPublicTemplates]);

  const publicTemplateArray = Object.values(publicTemplates);

  const handleImport = async (templateId: string): Promise<void> => {
    await importPublicTemplate(templateId);
  };

  return (
    <Dialog open={isOpen} onClose={closePublicLibrary} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Public Templates</Typography>
          <IconButton onClick={closePublicLibrary} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Search public templates..."
          value={publicSearchQuery}
          onChange={(e): void => setPublicSearchQuery(e.target.value)}
          sx={{ marginBottom: 3 }}
        />

        {publicTemplateArray.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No public templates found.
          </Typography>
        )}

        {publicTemplateArray.map((template) => (
          <Box key={template.id} sx={{ marginBottom: 2 }}>
            <TemplateCard
              template={template}
              authorName={publicTemplateAuthors[template.id]}
              showImportButton
              onImport={handleImport}
            />
          </Box>
        ))}
      </DialogContent>
    </Dialog>
  );
}
