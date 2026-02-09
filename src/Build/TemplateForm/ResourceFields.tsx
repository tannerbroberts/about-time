import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';

interface ResourceFieldsProps {
  prep_time?: number;
  cost?: number;
  errors: Record<string, string>;
  onChange: (field: string, value: number | undefined) => void;
}

export function ResourceFields({ prep_time, cost, errors, onChange }: ResourceFieldsProps): React.ReactElement {
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Resources (Optional)</Typography>
      <TextField
        label="Prep Time (minutes)"
        type="number"
        value={prep_time ?? ''}
        onChange={(e): void => onChange('prep_time', e.target.value ? parseFloat(e.target.value) : undefined)}
        error={Boolean(errors.prep_time)}
        helperText={errors.prep_time || 'Time to prepare this template'}
        fullWidth
        inputProps={{ min: 0, step: 1 }}
      />
      <TextField
        label="Cost ($)"
        type="number"
        value={cost ?? ''}
        onChange={(e): void => onChange('cost', e.target.value ? parseFloat(e.target.value) : undefined)}
        error={Boolean(errors.cost)}
        helperText={errors.cost || 'Cost in dollars'}
        fullWidth
        inputProps={{ min: 0, step: 0.01 }}
      />
    </Stack>
  );
}
