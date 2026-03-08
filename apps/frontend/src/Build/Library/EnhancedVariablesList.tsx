import type {
  CompositeSnapshot,
  VariableValue,
} from '@about-time/types/composite';
import type { ValueWithConfidence } from '@about-time/types/confidence';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React from 'react';

import { useBuildStore } from '../store';

interface EnhancedVariablesListProps {
  variables: Record<string, VariableValue>;
  type: 'produce' | 'consume';
  compact?: boolean;
}

/**
 * Format a value with confidence bounds
 */
function formatValueWithConfidence(value: ValueWithConfidence): string {
  if (value.lower !== undefined && value.upper !== undefined) {
    const range = ((value.upper - value.lower) / (2 * value.value)) * 100;
    return `${value.value} ±${range.toFixed(1)}% (${value.lower}-${value.upper})`;
  }
  return String(value.value);
}

/**
 * Render composite view (high-level units)
 */
function CompositeView({
  variables,
  color,
}: {
  variables: Record<string, VariableValue>;
  color: 'success' | 'warning';
}): React.ReactElement {
  return (
    <Stack direction="row" spacing={0.5} sx={{ marginTop: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
      {Object.entries(variables).map(([name, value]) => {
        let label = '';

        if (value.type === 'atomic') {
          label = `${name}: ${formatValueWithConfidence(value.data)}`;
        } else if (value.type === 'composite-live') {
          label = `${value.data.count} × ${value.data.compositeName}`;
        } else if (value.type === 'composite-snapshot') {
          label = `${value.data.count} × ${value.data.compositeName} (v${value.data.version})`;
        }

        return (
          <Chip
            key={name}
            label={label}
            size="small"
            color={color}
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 22 }}
          />
        );
      })}
    </Stack>
  );
}

/**
 * Render expanded view (all atomic values with sources)
 */
function ExpandedView({
  variables,
  color,
}: {
  variables: Record<string, VariableValue>;
  color: 'success' | 'warning';
}): React.ReactElement {
  // Aggregate all values by variable name
  const aggregated: Record<string, { total: ValueWithConfidence; sources: Array<{ name: string; value: ValueWithConfidence }> }> = {};

  Object.entries(variables).forEach(([name, value]) => {
    if (value.type === 'atomic') {
      // Simple atomic value
      if (!aggregated[name]) {
        aggregated[name] = { total: value.data, sources: [] };
      }
      aggregated[name].sources.push({ name: 'direct', value: value.data });
    } else if (value.type === 'composite-snapshot') {
      // Expand snapshot values
      const snapshot: CompositeSnapshot = value.data;
      Object.entries(snapshot.expandedValues).forEach(([varName, varValue]) => {
        if (!aggregated[varName]) {
          aggregated[varName] = { total: varValue, sources: [] };
        }
        aggregated[varName].sources.push({
          name: snapshot.compositeName,
          value: varValue,
        });
      });
    }
    // composite-live cannot be expanded without the composite definition
  });

  return (
    <Stack spacing={1} sx={{ marginTop: 0.5 }}>
      {Object.entries(aggregated).map(([varName, { total, sources }]) => (
        <Box key={varName}>
          <Chip
            label={`${varName}: ${formatValueWithConfidence(total)}`}
            size="small"
            color={color}
            variant="filled"
            sx={{ fontSize: '0.75rem', height: 24 }}
          />
          {sources.length > 1 && (
            <Box sx={{ marginLeft: 2, marginTop: 0.5 }}>
              {sources.map((source, idx) => (
                <Typography
                  key={idx}
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', fontSize: '0.65rem' }}
                >
                  ↳ {formatValueWithConfidence(source.value)} from {source.name}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      ))}
    </Stack>
  );
}

/**
 * Displays a list of variables with their values.
 * Supports both composite and expanded views based on global toggle.
 */
export function EnhancedVariablesList({
  variables,
  type,
  compact = false,
}: EnhancedVariablesListProps): React.ReactElement | null {
  const variableViewMode = useBuildStore((state) => state.variableViewMode);
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

  // Full mode: show variable details based on view mode
  return (
    <Box sx={{ marginTop: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
        {title}:
      </Typography>
      <Collapse in timeout="auto">
        {variableViewMode === 'composite' ? (
          <CompositeView variables={variables} color={color} />
        ) : (
          <ExpandedView variables={variables} color={color} />
        )}
      </Collapse>
    </Box>
  );
}
