import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import PublicIcon from '@mui/icons-material/Public';
import PublicOffIcon from '@mui/icons-material/PublicOff';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { BusyTemplate, Template } from '@tannerbroberts/about-time-core';
import React from 'react';

interface TemplateCardProps {
  template: Template;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCompose?: (id: string) => void;
  selectionMode?: boolean;
  onSelect?: (id: string) => void;
  isPublic?: boolean;
  onPublish?: (id: string) => void;
  onUnpublish?: (id: string) => void;
  authorName?: string;
  showImportButton?: boolean;
  onImport?: (id: string) => void;
}

export function TemplateCard({
  template,
  onEdit,
  onDelete,
  onCompose,
  selectionMode,
  onSelect,
  isPublic,
  onPublish,
  onUnpublish,
  authorName,
  showImportButton,
  onImport,
}: TemplateCardProps): React.ReactElement {
  const durationMinutes = Math.round(template.estimatedDuration / 60000);
  const templateType = template.templateType === 'busy' ? 'Busy' : 'Lane';
  const chipColor = template.templateType === 'busy' ? 'primary' : 'success';

  // Count variables for BusyTemplate
  const busyTemplate = template as BusyTemplate;
  const produceCount = busyTemplate.willProduce ? Object.keys(busyTemplate.willProduce).length : 0;
  const consumeCount = busyTemplate.willConsume ? Object.keys(busyTemplate.willConsume).length : 0;
  const totalVariables = produceCount + consumeCount;

  const handleCardClick = (): void => {
    if (selectionMode && onSelect) {
      onSelect(template.id);
    }
  };

  return (
    <Card
      sx={{
        marginBottom: 2,
        cursor: selectionMode ? 'pointer' : 'default',
        transition: 'box-shadow 0.1s linear, border-color 0.1s linear',
        '&:hover': selectionMode ? {
          boxShadow: 4,
          borderColor: 'primary.main',
        } : {},
        '&:active': selectionMode ? {
          boxShadow: 2,
        } : {},
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" marginBottom={1}>
          <Typography variant="h6" component="div">
            {template.intent}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip label={templateType} color={chipColor} size="small" />
            {isPublic && (
              <Chip
                label="Public"
                color="secondary"
                size="small"
                icon={<PublicIcon />}
              />
            )}
          </Stack>
        </Stack>
        {authorName && (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', marginBottom: 0.5, display: 'block' }}>
            by {authorName}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          Duration: {durationMinutes} min
        </Typography>
        {totalVariables > 0 && (
          <Box sx={{ marginTop: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {produceCount > 0 && `Produces: ${produceCount} variable${produceCount > 1 ? 's' : ''}`}
              {produceCount > 0 && consumeCount > 0 && ' • '}
              {consumeCount > 0 && `Consumes: ${consumeCount} variable${consumeCount > 1 ? 's' : ''}`}
            </Typography>
          </Box>
        )}
      </CardContent>
      {!selectionMode && (
        <CardActions sx={{ justifyContent: 'flex-end', padding: 2, paddingTop: 0 }}>
          {showImportButton && onImport ? (
            <Tooltip title="Import to My Library">
              <IconButton
                size="small"
                color="info"
                onClick={(): void => onImport(template.id)}
                aria-label="Import template"
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <>
              {onPublish && onUnpublish && (
                isPublic ? (
                  <Tooltip title="Unpublish (Make Private)">
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={(): void => onUnpublish(template.id)}
                      aria-label="Unpublish template"
                    >
                      <PublicOffIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Publish (Share Publicly)">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={(): void => onPublish(template.id)}
                      aria-label="Publish template"
                    >
                      <PublicIcon />
                    </IconButton>
                  </Tooltip>
                )
              )}
              {onCompose && (
                <Tooltip title="Open in Editor">
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={(): void => onCompose(template.id)}
                    aria-label="Open template in editor"
                  >
                    <AccountTreeIcon />
                  </IconButton>
                </Tooltip>
              )}
              {onEdit && (
                <Tooltip title="Edit Properties">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={(): void => onEdit(template.id)}
                    aria-label="Edit template"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(): void => onDelete(template.id)}
                    aria-label="Delete template"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </CardActions>
      )}
    </Card>
  );
}
