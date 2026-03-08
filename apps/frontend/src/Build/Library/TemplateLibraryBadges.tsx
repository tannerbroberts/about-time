/**
 * Component to display library badges for a template
 */

import FolderIcon from '@mui/icons-material/Folder';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { useMemo } from 'react';

import { useBuildStore } from '../store';

interface TemplateLibraryBadgesProps {
  templateId: string;
}

export function TemplateLibraryBadges({
  templateId,
}: TemplateLibraryBadgesProps): React.ReactElement | null {
  const libraries = useBuildStore((state) => state.libraries);
  const libraryTemplates = useBuildStore((state) => state.libraryTemplates);

  // Find all libraries that contain this template
  const memberLibraries = useMemo(() => {
    const containingLibraries: string[] = [];
    Object.entries(libraryTemplates).forEach(([libraryId, templates]) => {
      if (templates.some((t) => t.id === templateId)) {
        containingLibraries.push(libraryId);
      }
    });
    return containingLibraries;
  }, [templateId, libraryTemplates]);

  if (memberLibraries.length === 0) {
    return null;
  }

  const displayLibraries = memberLibraries.slice(0, 2);
  const hasMore = memberLibraries.length > 2;

  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
      {displayLibraries.map((libraryId) => {
        const library = libraries[libraryId];
        if (!library) return null;

        return (
          <Tooltip key={libraryId} title={`In library: ${library.name}`}>
            <Chip
              icon={<FolderIcon />}
              label={library.name}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          </Tooltip>
        );
      })}
      {hasMore && (
        <Tooltip
          title={(
            <Box>
              <Typography variant="caption" component="div" gutterBottom>
                Also in:
              </Typography>
              {memberLibraries.slice(2).map((libraryId) => {
                const library = libraries[libraryId];
                return library ? (
                  <Typography key={libraryId} variant="caption" component="div">
                    • {library.name}
                  </Typography>
                ) : null;
              })}
            </Box>
          )}
        >
          <Chip
            label={`+${memberLibraries.length - 2} more`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        </Tooltip>
      )}
    </Box>
  );
}
