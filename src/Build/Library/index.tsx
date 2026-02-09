import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Fab from '@mui/material/Fab';
import React from 'react';

import { useBuildContext } from '../useContext';

import { EmptyState } from './EmptyState';
import { TemplateCard } from './TemplateCard';

export function Library(): React.ReactElement {
  const { state, dispatch } = useBuildContext();

  const templateArray = Object.values(state.templates);
  const hasTemplates = templateArray.length > 0;

  const handleCreateClick = (): void => {
    dispatch({ type: 'OPEN_TEMPLATE_FORM' });
  };

  const handleEditClick = (templateId: string): void => {
    dispatch({ type: 'OPEN_TEMPLATE_FORM', templateId });
  };

  const handleDeleteClick = (templateId: string): void => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      dispatch({ type: 'DELETE_TEMPLATE', id: templateId });
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
