import type { ValueWithConfidence } from '@about-time/types';
import { formatWithConfidence } from '@about-time/types';
import { Box, Typography } from '@mui/material';
import type { LaneTemplate, Template } from '@tannerbroberts/about-time-core';
import React from 'react';

import { useBuildStore } from '../../store';
import { calculateNestedVariablesWithConfidence } from '../../utils/confidenceAggregation';

interface LanePropertiesProps {
  template: LaneTemplate;
}

interface NestedVariablesSummaryProps {
  willProduce: Record<string, ValueWithConfidence>;
  willConsume: Record<string, ValueWithConfidence>;
}

function NestedVariablesSummary({ willProduce, willConsume }: NestedVariablesSummaryProps): React.ReactElement {
  const hasProduction = Object.keys(willProduce).length > 0;
  const hasConsumption = Object.keys(willConsume).length > 0;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ mb: 1, fontWeight: 600, fontSize: '0.875rem' }}>Nested Variables Summary</Box>

      {/* Will Produce */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
          Will Produce (Total):
        </Typography>
        {hasProduction ? (
          <Box sx={{ pl: 2 }}>
            {Object.entries(willProduce).map(([key, value]) => (
              <Typography key={key} variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {key}: {formatWithConfidence(value)}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ pl: 2, color: 'text.secondary', fontStyle: 'italic' }}>
            No production variables
          </Typography>
        )}
      </Box>

      {/* Will Consume */}
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
          Will Consume (Total):
        </Typography>
        {hasConsumption ? (
          <Box sx={{ pl: 2 }}>
            {Object.entries(willConsume).map(([key, value]) => (
              <Typography key={key} variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {key}: {formatWithConfidence(value)}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ pl: 2, color: 'text.secondary', fontStyle: 'italic' }}>
            No consumption variables
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export function LaneProperties({ template }: LanePropertiesProps): React.ReactElement {
  const templates = useBuildStore((state) => state.templates);

  // Memoized aggregation - recalculates only when template ID or templates map changes
  // TODO: In future, pass variablesWithConfidence map from database
  const nestedVariables = React.useMemo(
    () => calculateNestedVariablesWithConfidence(template.id, templates as Record<string, Template>),
    [template.id, templates],
  );

  return (
    <Box>
      <NestedVariablesSummary willProduce={nestedVariables.willProduce} willConsume={nestedVariables.willConsume} />
    </Box>
  );
}
