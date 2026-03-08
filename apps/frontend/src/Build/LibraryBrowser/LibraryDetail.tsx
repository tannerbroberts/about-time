/**
 * Library Detail component for viewing and managing templates in a library
 */

import type { Library } from '@about-time/types/library';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RemoveIcon from '@mui/icons-material/Remove';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import React, { useEffect } from 'react';

import { TemplateLibraryBadges } from '../Library/TemplateLibraryBadges';
import { useBuildStore } from '../store';

import { TemplateSelector } from './TemplateSelector';

interface LibraryDetailProps {
  library: Library;
  onBack: () => void;
}

export function LibraryDetail({ library, onBack }: LibraryDetailProps): React.ReactElement {
  const libraryTemplates = useBuildStore((state) => state.libraryTemplates[library.id] || []);
  const removeTemplateFromLibrary = useBuildStore((state) => state.removeTemplateFromLibrary);
  const loadLibraryTemplates = useBuildStore((state) => state.loadLibraryTemplates);
  const [isSelectorOpen, setIsSelectorOpen] = React.useState(false);

  useEffect(() => {
    loadLibraryTemplates(library.id);
  }, [library.id, loadLibraryTemplates]);

  const handleRemove = async (templateId: string): Promise<void> => {
    const confirmMessage = `Remove this template from "${library.name}"?\n\nNote: The template itself will NOT be deleted, only removed from this library. It will still exist in your main template list and any other libraries.`;
    if (window.confirm(confirmMessage)) {
      await removeTemplateFromLibrary(library.id, templateId);
    }
  };

  const handleAddTemplate = (): void => {
    setIsSelectorOpen(true);
  };

  const handleCloseSelector = (): void => {
    setIsSelectorOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={onBack} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Templates in {library.name}</Typography>
      </Box>

      {library.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {library.description}
        </Typography>
      )}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAddTemplate}
        fullWidth
        sx={{ mb: 2 }}
      >
        Add Template
      </Button>

      {libraryTemplates.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No templates in this library yet
          </Typography>
        </Box>
      )}

      {libraryTemplates.length > 0 && (
        <List>
          {libraryTemplates.map((template) => (
            <ListItem
              key={template.id}
              sx={{ px: 0 }}
            >
              <Card sx={{ width: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">{template.intent}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {template.templateType === 'busy' ? 'Busy Template' : 'Lane Template'}
                      </Typography>
                      <Box sx={{ marginTop: 1 }}>
                        <TemplateLibraryBadges templateId={template.id} />
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(): Promise<void> => handleRemove(template.id)}
                      color="error"
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </ListItem>
          ))}
        </List>
      )}

      <TemplateSelector
        open={isSelectorOpen}
        onClose={handleCloseSelector}
        libraryId={library.id}
      />
    </Box>
  );
}
