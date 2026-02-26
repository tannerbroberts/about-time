import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
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

  const handleCreateBusyClick = (): void => {
    openTemplateForm(undefined, 'busy');
  };

  const handleCreateLaneClick = (): void => {
    openTemplateForm(undefined, 'lane');
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
      {!hasTemplates && <EmptyState onCreateBusyClick={handleCreateBusyClick} onCreateLaneClick={handleCreateLaneClick} />}

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
        <SpeedDial
          ariaLabel="Create template"
          icon={<AddIcon />}
          sx={{
            position: 'fixed',
            bottom: 72,
            right: 16,
          }}
        >
          <SpeedDialAction
            icon={<CheckCircleIcon />}
            tooltipTitle="Busy Template"
            onClick={handleCreateBusyClick}
          />
          <SpeedDialAction
            icon={<AccountTreeIcon />}
            tooltipTitle="Lane Template"
            onClick={handleCreateLaneClick}
          />
        </SpeedDial>
      )}
    </Container>
  );
}
