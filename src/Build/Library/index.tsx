import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Fab from '@mui/material/Fab';
import React from 'react';

import { useBuildStore } from '../store';

import { EmptyState } from './EmptyState';
import { TemplateCard } from './TemplateCard';

export function Library(): React.ReactElement {
  const templates = useBuildStore((state) => state.templates);
  const openTemplateForm = useBuildStore((state) => state.openTemplateForm);
  const deleteTemplate = useBuildStore((state) => state.deleteTemplate);
  const openTemplateEditor = useBuildStore((state) => state.openTemplateEditor);

  const templateArray = Object.values(templates);
  const hasTemplates = templateArray.length > 0;

  const handleCreateClick = (): void => {
    openTemplateForm();
  };

  const handleEditClick = (templateId: string): void => {
    openTemplateForm(templateId);
  };

  const handleComposeClick = (templateId: string): void => {
    openTemplateEditor(templateId);
  };

  const handleDeleteClick = (templateId: string): void => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(templateId);
    }
  };

  return (
    <Container maxWidth="md" sx={{ paddingTop: 3, paddingBottom: 3 }}>
      {!hasTemplates && <EmptyState onCreateClick={handleCreateClick} />}

      {hasTemplates && (
        <Box>
          {templateArray.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onCompose={handleComposeClick}
            />
          ))}
        </Box>
      )}

      {hasTemplates && (
        <Fab
          color="primary"
          aria-label="Create template"
          sx={{
            position: 'fixed',
            bottom: 72, // Above bottom navigation
            right: 16,
          }}
          onClick={handleCreateClick}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
}
