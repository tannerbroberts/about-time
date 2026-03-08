/**
 * Template card for deduplicated view showing library membership
 */

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';

import type { DeduplicatedTemplate } from '../utils/deduplication';

import { TemplateCard } from './TemplateCard';

interface DeduplicatedTemplateCardProps {
  deduplicatedTemplate: DeduplicatedTemplate;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCompose: (id: string) => void;
  onPublish: (id: string) => Promise<void>;
  onUnpublish: (id: string) => Promise<void>;
  onAddToLibrary: (id: string) => void;
}

export function DeduplicatedTemplateCard({
  deduplicatedTemplate,
  onEdit,
  onDelete,
  onCompose,
  onPublish,
  onUnpublish,
  onAddToLibrary,
}: DeduplicatedTemplateCardProps): React.ReactElement {
  const { template, libraryNames } = deduplicatedTemplate;
  const [isExpanded, setIsExpanded] = useState(false);

  const libraryCount = libraryNames.length;
  const hasLibraries = libraryCount > 0;

  const toggleExpanded = (): void => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Box sx={{ marginBottom: 2 }}>
      <TemplateCard
        template={template}
        onEdit={onEdit}
        onDelete={onDelete}
        onCompose={onCompose}
        isPublic={template.isPublic}
        onPublish={onPublish}
        onUnpublish={onUnpublish}
        onAddToLibrary={onAddToLibrary}
      />

      {hasLibraries && (
        <Box
          sx={{
            marginTop: -1,
            paddingLeft: 2,
            paddingRight: 2,
            paddingBottom: 1,
            backgroundColor: 'grey.50',
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">
                In {libraryCount} {libraryCount === 1 ? 'library' : 'libraries'}:
              </Typography>

              <Collapse in={isExpanded} orientation="horizontal">
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {libraryNames.map((name) => (
                    <Chip key={name} label={name} size="small" variant="outlined" />
                  ))}
                </Box>
              </Collapse>

              {!isExpanded && libraryCount > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {libraryNames.slice(0, 2).join(', ')}
                  {libraryCount > 2 && `, +${libraryCount - 2} more`}
                </Typography>
              )}
            </Box>

            <IconButton size="small" onClick={toggleExpanded}>
              {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}
