
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import React from 'react';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps): React.ReactElement {
  return (
    <Box>
      <TextField
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        label="Time"
        InputLabelProps={{
          shrink: true,
        }}
      />
    </Box>
  );
}
