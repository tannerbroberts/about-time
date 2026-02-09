import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';

interface MacroFieldsProps {
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fats_g?: number;
  errors: Record<string, string>;
  onChange: (field: string, value: number | undefined) => void;
}

export function MacroFields({
  calories,
  protein_g,
  carbs_g,
  fats_g,
  errors,
  onChange,
}: MacroFieldsProps): React.ReactElement {
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Macros (Optional)</Typography>
      <TextField
        label="Calories"
        type="number"
        value={calories ?? ''}
        onChange={(e): void => onChange('calories', e.target.value ? parseFloat(e.target.value) : undefined)}
        error={Boolean(errors.calories)}
        helperText={errors.calories}
        fullWidth
        inputProps={{ min: 0, step: 1 }}
      />
      <TextField
        label="Protein (g)"
        type="number"
        value={protein_g ?? ''}
        onChange={(e): void => onChange('protein_g', e.target.value ? parseFloat(e.target.value) : undefined)}
        error={Boolean(errors.protein_g)}
        helperText={errors.protein_g}
        fullWidth
        inputProps={{ min: 0, step: 0.1 }}
      />
      <TextField
        label="Carbs (g)"
        type="number"
        value={carbs_g ?? ''}
        onChange={(e): void => onChange('carbs_g', e.target.value ? parseFloat(e.target.value) : undefined)}
        error={Boolean(errors.carbs_g)}
        helperText={errors.carbs_g}
        fullWidth
        inputProps={{ min: 0, step: 0.1 }}
      />
      <TextField
        label="Fats (g)"
        type="number"
        value={fats_g ?? ''}
        onChange={(e): void => onChange('fats_g', e.target.value ? parseFloat(e.target.value) : undefined)}
        error={Boolean(errors.fats_g)}
        helperText={errors.fats_g}
        fullWidth
        inputProps={{ min: 0, step: 0.1 }}
      />
    </Stack>
  );
}
