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

  const handleWillProduceChange = (variables: Record<string, number>): void => {
    updateTemplate(template.id, {
      ...template,
      willProduce: variables,
    });
  };

  const handleWillConsumeChange = (variables: Record<string, number>): void => {
    updateTemplate(template.id, {
      ...template,
      willConsume: variables,
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
