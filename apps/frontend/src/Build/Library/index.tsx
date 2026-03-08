import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExploreIcon from '@mui/icons-material/Explore';
import FolderIcon from '@mui/icons-material/Folder';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import React, { useEffect, useMemo } from 'react';

import { useBuildStore } from '../store';
import { getProcessedTemplates } from '../utils/deduplication';

import { DeduplicatedTemplateCard } from './DeduplicatedTemplateCard';
import { EmptyState } from './EmptyState';
import { LibrarySelector } from './LibrarySelector';
import { SearchBar } from './SearchBar';
import { TemplateCard } from './TemplateCard';

export function Library(): React.ReactElement {
  const templates = useBuildStore((state) => state.templates);
  const libraries = useBuildStore((state) => state.libraries);
  const libraryTemplates = useBuildStore((state) => state.libraryTemplates);
  const searchQuery = useBuildStore((state) => state.searchQuery);
  const deduplicateLibraries = useBuildStore((state) => state.deduplicateLibraries);
  const openTemplateForm = useBuildStore((state) => state.openTemplateForm);
  const deleteTemplate = useBuildStore((state) => state.deleteTemplate);
  const openTemplateEditor = useBuildStore((state) => state.openTemplateEditor);
  const publishTemplate = useBuildStore((state) => state.publishTemplate);
  const unpublishTemplate = useBuildStore((state) => state.unpublishTemplate);
  const openPublicLibrary = useBuildStore((state) => state.openPublicLibrary);
  const openLibraryBrowser = useBuildStore((state) => state.openLibraryBrowser);
  const loadLibraries = useBuildStore((state) => state.loadLibraries);
  const loadLibraryTemplates = useBuildStore((state) => state.loadLibraryTemplates);

  const [templateIdForLibrary, setTemplateIdForLibrary] = React.useState<string | null>(null);

  // Load libraries and their templates for badge display and deduplication
  useEffect(() => {
    const loadLibraryData = async (): Promise<void> => {
      await loadLibraries();
      // Load templates for all libraries to show badges and enable deduplication
      const libraryIds = Object.keys(libraries);
      await Promise.all(libraryIds.map((id) => loadLibraryTemplates(id)));
    };
    loadLibraryData();
  }, [loadLibraries, loadLibraryTemplates, libraries]);

  // Process templates with search and deduplication
  const processedData = useMemo(() => {
    const templateArray = Object.values(templates);
    return getProcessedTemplates(
      templateArray,
      libraryTemplates,
      libraries,
      searchQuery,
      deduplicateLibraries,
    );
  }, [templates, libraryTemplates, libraries, searchQuery, deduplicateLibraries]);

  const hasTemplates = Object.keys(templates).length > 0;

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
    const confirmMessage = 'Are you sure you want to permanently DELETE this template?\n\nThis will:\n• Remove it from ALL libraries\n• Delete it from your template collection\n• Cannot be undone\n\nTo just remove from a specific library, use the Library Browser instead.';
    if (window.confirm(confirmMessage)) {
      deleteTemplate(templateId);
    }
  };

  const handlePublishClick = async (templateId: string): Promise<void> => {
    await publishTemplate(templateId);
  };

  const handleUnpublishClick = async (templateId: string): Promise<void> => {
    await unpublishTemplate(templateId);
  };

  const handleAddToLibraryClick = (templateId: string): void => {
    setTemplateIdForLibrary(templateId);
  };

  const handleCloseLibrarySelector = (): void => {
    setTemplateIdForLibrary(null);
  };

  return (
    <Container maxWidth="md" sx={{ paddingTop: 3, paddingBottom: 3 }}>
      {!hasTemplates && <EmptyState onCreateBusyClick={handleCreateBusyClick} onCreateLaneClick={handleCreateLaneClick} />}

      {hasTemplates && (
        <Box>
          <Box sx={{ marginBottom: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FolderIcon />}
              onClick={openLibraryBrowser}
              fullWidth
            >
              Manage Libraries
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExploreIcon />}
              onClick={openPublicLibrary}
              fullWidth
            >
              Browse Public Templates
            </Button>
          </Box>

          <SearchBar
            templateCount={processedData.totalCount}
            uniqueCount={deduplicateLibraries ? processedData.uniqueCount : undefined}
          />

          {deduplicateLibraries ? (
            <>
              {processedData.deduplicatedTemplates.map((dedupTemplate) => (
                <DeduplicatedTemplateCard
                  key={dedupTemplate.template.id}
                  deduplicatedTemplate={dedupTemplate}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  onCompose={handleComposeClick}
                  onPublish={handlePublishClick}
                  onUnpublish={handleUnpublishClick}
                  onAddToLibrary={handleAddToLibraryClick}
                />
              ))}
            </>
          ) : (
            <>
              {processedData.templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  onCompose={handleComposeClick}
                  isPublic={template.isPublic}
                  onPublish={handlePublishClick}
                  onUnpublish={handleUnpublishClick}
                  onAddToLibrary={handleAddToLibraryClick}
                />
              ))}
            </>
          )}
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

      {templateIdForLibrary && (
        <LibrarySelector
          open={!!templateIdForLibrary}
          onClose={handleCloseLibrarySelector}
          templateId={templateIdForLibrary}
        />
      )}
    </Container>
  );
}
