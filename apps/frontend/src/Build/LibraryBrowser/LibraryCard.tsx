/**
 * Library Card component for displaying library information
 */

import type { Library } from '@about-time/types/library';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FolderIcon from '@mui/icons-material/Folder';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import React from 'react';

interface LibraryCardProps {
  library: Library;
  onClick: (libraryId: string) => void;
  onEdit: (libraryId: string) => void;
  onDelete: (libraryId: string) => void;
}

export function LibraryCard({
  library,
  onClick,
  onEdit,
  onDelete,
}: LibraryCardProps): React.ReactElement {
  const handleClick = (): void => {
    onClick(library.id);
  };

  const handleEdit = (event: React.MouseEvent): void => {
    event.stopPropagation();
    onEdit(library.id);
  };

  const handleDelete = (event: React.MouseEvent): void => {
    event.stopPropagation();
    onDelete(library.id);
  };

  const visibilityColor = {
    private: 'default',
    unlisted: 'warning',
    public: 'success',
  } as const;

  return (
    <Card sx={{ mb: 2 }}>
      <CardActionArea onClick={handleClick}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FolderIcon color="primary" />
                <Typography variant="h6">{library.name}</Typography>
                <Chip
                  label={library.visibility}
                  size="small"
                  color={visibilityColor[library.visibility]}
                />
              </Box>

              {library.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {library.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {library.templateCount} template{library.templateCount !== 1 ? 's' : ''}
                </Typography>
                {library.laneTemplateId && (
                  <Typography variant="caption" color="primary">
                    Linked to lane template
                  </Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton size="small" onClick={handleEdit}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleDelete} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
