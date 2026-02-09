import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Template } from '@tannerbroberts/about-time-core';
import React from 'react';

interface TemplateCardProps {
  template: Template;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps): React.ReactElement {
  const durationMinutes = Math.round(template.estimatedDuration / 60000);
  const templateType = template.type === 'BusyTemplate' ? 'Busy' : 'Lane';
  const chipColor = template.type === 'BusyTemplate' ? 'primary' : 'success';

  return (
    <Card sx={{ marginBottom: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" marginBottom={1}>
          <Typography variant="h6" component="div">
            {template.intent}
          </Typography>
          <Chip label={templateType} color={chipColor} size="small" />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Duration: {durationMinutes} min
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', padding: 2, paddingTop: 0 }}>
        <IconButton
          size="small"
          color="primary"
          onClick={(): void => onEdit(template.id)}
          aria-label="Edit template"
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={(): void => onDelete(template.id)}
          aria-label="Delete template"
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}
