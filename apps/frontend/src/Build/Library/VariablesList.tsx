import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React from 'react';

interface VariablesListProps {
  variables: Record<string, number>;
  type: 'produce' | 'consume';
  compact?: boolean;
}

/**
 * Displays a list of variables with their values.
 * In the future, this will also display confidence bounds from the template_variables table.
 */
export function VariablesList({
  variables,
  type,
  compact = false,
}: VariablesListProps): React.ReactElement | null {
  const entries = Object.entries(variables);

  if (entries.length === 0) {
    return null;
  }

  const title = type === 'produce' ? 'Produces' : 'Consumes';
  const color = type === 'produce' ? 'success' : 'warning';

  if (compact) {
    // Compact mode: just show count
    return (
      <Typography variant="caption" color="text.secondary">
        {title}: {entries.length} variable{entries.length > 1 ? 's' : ''}
      </Typography>
    );
  }

  // Full mode: show variable details
  return (
    <Box sx={{ marginTop: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
        {title}:
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ marginTop: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
        {entries.map(([name, value]) => (
          <Tooltip key={name} title={`${name}: ${value}`}>
            <Chip
              label={`${name}: ${value}`}
              size="small"
              color={color}
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 22 }}
            />
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
}
