import type { ValueWithConfidence } from '@about-time/types';
import { getNominalValue } from '@about-time/types';
import Box from '@mui/material/Box';
import type { BusyTemplate } from '@tannerbroberts/about-time-core';
import React from 'react';

import { useBuildStore } from '../../store';
import { VariableEditor } from '../../TemplateForm/VariableEditor';

export interface BusyPropertiesProps {
  template: BusyTemplate;
}

export function BusyProperties({ template }: BusyPropertiesProps): React.ReactElement {
  const updateTemplate = useBuildStore((state) => state.updateTemplate);

  const handleWillProduceChange = (variables: Record<string, number | ValueWithConfidence>): void => {
    // Convert to nominal values for template storage
    const nominalValues: Record<string, number> = {};
    Object.entries(variables).forEach(([key, val]) => {
      nominalValues[key] = getNominalValue(val);
    });

    updateTemplate(template.id, {
      ...template,
      willProduce: nominalValues,
    });
  };

  const handleWillConsumeChange = (variables: Record<string, number | ValueWithConfidence>): void => {
    // Convert to nominal values for template storage
    const nominalValues: Record<string, number> = {};
    Object.entries(variables).forEach(([key, val]) => {
      nominalValues[key] = getNominalValue(val);
    });

    updateTemplate(template.id, {
      ...template,
      willConsume: nominalValues,
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <VariableEditor
        title="Will Produce"
        variables={template.willProduce || {}}
        onChange={handleWillProduceChange}
      />
      <VariableEditor
        title="Will Consume"
        variables={template.willConsume || {}}
        onChange={handleWillConsumeChange}
      />
    </Box>
  );
}
