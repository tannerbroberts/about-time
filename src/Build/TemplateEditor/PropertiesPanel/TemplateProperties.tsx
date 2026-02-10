import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import type { Template } from '@tannerbroberts/about-time-core';
import React from 'react';

import { useBuildStore } from '../../store';

export interface TemplatePropertiesProps {
  template: Template;
}

export function TemplateProperties({ template }: TemplatePropertiesProps): React.ReactElement {
  const updateTemplate = useBuildStore((state) => state.updateTemplate);

  const [name, setName] = React.useState(template.intent || '');
  const [durationMinutes, setDurationMinutes] = React.useState(
    Math.round(template.estimatedDuration / 60000),
  );

  // Sync local state when template changes from external updates
  React.useEffect(() => {
    setName(template.intent || '');
    setDurationMinutes(Math.round(template.estimatedDuration / 60000));
  }, [template.id, template.intent, template.estimatedDuration]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newName = e.target.value;
    setName(newName);
    updateTemplate(template.id, { ...template, intent: newName });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const minutes = parseInt(e.target.value, 10);
    if (!isNaN(minutes) && minutes > 0) {
      setDurationMinutes(minutes);
      updateTemplate(template.id, {
        ...template,
        estimatedDuration: minutes * 60000,
      });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Template Name"
        value={name}
        onChange={handleNameChange}
        fullWidth
        size="small"
      />
      <TextField
        label="Duration (minutes)"
        type="number"
        value={durationMinutes}
        onChange={handleDurationChange}
        fullWidth
        size="small"
        inputProps={{ min: 1 }}
      />
    </Box>
  );
}
