
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import type { BusyTemplate, LaneTemplate, TemplateMap } from '@tannerbroberts/about-time-core';
import React from 'react';

interface TemplateSelectorProps {
  templates: TemplateMap;
  value: string;
  onChange: (value: string) => void;
}

export function TemplateSelector({ templates, value, onChange }: TemplateSelectorProps): React.ReactElement {
  const schedulableTemplates = Object.values(templates).filter(
    (t): t is BusyTemplate | LaneTemplate => t.templateType === 'busy' || t.templateType === 'lane',
  );

  return (
    <FormControl fullWidth>
      <InputLabel>Meal Template</InputLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        label="Meal Template"
      >
        {schedulableTemplates.map((template) => (
          <MenuItem key={template.id} value={template.id}>
            {template.intent}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
