import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import React from 'react';

interface BasicInfoFieldsProps {
  name: string;
  durationMinutes: number;
  errors: Record<string, string>;
  onChange: (field: string, value: string | number) => void;
  onSubmit?: () => void;
  nameInputRef?: React.RefObject<HTMLInputElement>;
}

export function BasicInfoFields({ name, durationMinutes, errors, onChange, onSubmit, nameInputRef }: BasicInfoFieldsProps): React.ReactElement {
  const handleDurationKeyPress = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Name"
        value={name}
        onChange={(e): void => onChange('name', e.target.value)}
        error={Boolean(errors.name)}
        helperText={errors.name}
        required
        fullWidth
        inputRef={nameInputRef}
      />
      <TextField
        label="Duration (minutes)"
        type="number"
        value={durationMinutes || ''}
        onChange={(e): void => onChange('durationMinutes', parseFloat(e.target.value) || 0)}
        onKeyPress={handleDurationKeyPress}
        error={Boolean(errors.durationMinutes)}
        helperText={errors.durationMinutes}
        required
        fullWidth
        inputProps={{ min: 0, step: 1 }}
      />
    </Stack>
  );
}
