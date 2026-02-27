import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExploreIcon from '@mui/icons-material/Explore';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
  const publishTemplate = useBuildStore((state) => state.publishTemplate);
  const unpublishTemplate = useBuildStore((state) => state.unpublishTemplate);
  const openPublicLibrary = useBuildStore((state) => state.openPublicLibrary);

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

  const handlePublishClick = async (templateId: string): Promise<void> => {
    await publishTemplate(templateId);
  };

  const handleUnpublishClick = async (templateId: string): Promise<void> => {
    await unpublishTemplate(templateId);
  };

  return (
    <Container maxWidth="md" sx={{ paddingTop: 3, paddingBottom: 3 }}>
      {!hasTemplates && <EmptyState onCreateBusyClick={handleCreateBusyClick} onCreateLaneClick={handleCreateLaneClick} />}

      {hasTemplates && (
        <Box>
          <Box sx={{ marginBottom: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ExploreIcon />}
              onClick={openPublicLibrary}
              fullWidth
            >
              Browse Public Templates
            </Button>
          </Box>

          {templateArray.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onCompose={handleComposeClick}
              isPublic={template.isPublic}
              onPublish={handlePublishClick}
              onUnpublish={handleUnpublishClick}
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
