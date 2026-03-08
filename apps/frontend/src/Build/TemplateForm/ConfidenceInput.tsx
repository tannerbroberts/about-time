import type { ValueWithConfidence } from '@about-time/types';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';

interface ConfidenceInputProps {
  label: string;
  value: number | ValueWithConfidence;
  onChange: (value: number | ValueWithConfidence) => void;
  disabled?: boolean;
}

/**
 * Input component for values with optional confidence bounds.
 * Allows users to specify a nominal value with optional lower and upper bounds.
 */
export function ConfidenceInput({
  label,
  value,
  onChange,
  disabled = false,
}: ConfidenceInputProps): React.ReactElement {
  // Parse current value
  const currentValue = typeof value === 'number' ? { value } : value;
  const hasConfidence = currentValue.lower !== undefined || currentValue.upper !== undefined;

  // Confidence panel expansion state
  const [isConfidenceExpanded, setIsConfidenceExpanded] = useState(hasConfidence);

  const handleNominalChange = (newValue: number): void => {
    if (hasConfidence) {
      onChange({
        value: newValue,
        lower: currentValue.lower,
        upper: currentValue.upper,
      });
    } else {
      onChange(newValue);
    }
  };

  const handleLowerChange = (newLower: string): void => {
    const lowerValue = newLower === '' ? undefined : parseFloat(newLower);
    onChange({
      value: currentValue.value,
      lower: lowerValue,
      upper: currentValue.upper,
    });
  };

  const handleUpperChange = (newUpper: string): void => {
    const upperValue = newUpper === '' ? undefined : parseFloat(newUpper);
    onChange({
      value: currentValue.value,
      lower: currentValue.lower,
      upper: upperValue,
    });
  };

  const toggleConfidence = (): void => {
    setIsConfidenceExpanded(!isConfidenceExpanded);
  };

  // Validation
  const lowerError = currentValue.lower !== undefined && currentValue.lower > currentValue.value
    ? 'Lower bound cannot exceed value'
    : undefined;
  const upperError = currentValue.upper !== undefined && currentValue.upper < currentValue.value
    ? 'Upper bound cannot be less than value'
    : undefined;

  return (
    <Stack spacing={1}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label={label}
          type="number"
          value={currentValue.value}
          onChange={(e): void => handleNominalChange(parseFloat(e.target.value) || 0)}
          size="small"
          disabled={disabled}
          sx={{ flex: 1 }}
          inputProps={{ step: 1 }}
        />
        <Tooltip title={isConfidenceExpanded ? 'Hide confidence bounds' : 'Show confidence bounds'}>
          <IconButton
            size="small"
            onClick={toggleConfidence}
            disabled={disabled}
            aria-label="Toggle confidence bounds"
          >
            {isConfidenceExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Collapse in={isConfidenceExpanded}>
        <Stack spacing={1} sx={{ paddingLeft: 2, borderLeft: 2, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Confidence Bounds (optional)
          </Typography>
          <TextField
            label="Lower Bound"
            type="number"
            value={currentValue.lower ?? ''}
            onChange={(e): void => handleLowerChange(e.target.value)}
            size="small"
            disabled={disabled}
            error={!!lowerError}
            helperText={lowerError}
            placeholder={`Min: ${currentValue.value}`}
            inputProps={{ step: 1 }}
          />
          <TextField
            label="Upper Bound"
            type="number"
            value={currentValue.upper ?? ''}
            onChange={(e): void => handleUpperChange(e.target.value)}
            size="small"
            disabled={disabled}
            error={!!upperError}
            helperText={upperError}
            placeholder={`Max: ${currentValue.value}`}
            inputProps={{ step: 1 }}
          />
        </Stack>
      </Collapse>
    </Stack>
  );
}
