import { Box, Typography } from '@mui/material';
import type { LaneTemplate, Template } from '@tannerbroberts/about-time-core';
import React from 'react';

import { useBuildStore } from '../../store';
import { calculateNestedVariables } from '../../utils/variableAggregation';

import { LayoutButtons } from './LayoutButtons';

interface LanePropertiesProps {
  template: LaneTemplate;
}

interface NestedVariablesSummaryProps {
  willProduce: Record<string, number>;
  willConsume: Record<string, number>;
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
                {key}: {value}
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
                {key}: {value}
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
  const nestedVariables = React.useMemo(
    () => calculateNestedVariables(template.id, templates as Record<string, Template>),
    [template.id, templates],
  );

  return (
    <Box>
      <LayoutButtons template={template} />
      <NestedVariablesSummary willProduce={nestedVariables.willProduce} willConsume={nestedVariables.willConsume} />
    </Box>
  );
}
