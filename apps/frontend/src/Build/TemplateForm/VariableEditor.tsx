import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';

interface VariableEditorProps {
  title: string;
  variables: Record<string, number>;
  onChange: (variables: Record<string, number>) => void;
}

export function VariableEditor({ title, variables, onChange }: VariableEditorProps): React.ReactElement {
  const variableEntries = Object.entries(variables);

  const handleAddVariable = (): void => {
    const newVariables = { ...variables, '': 0 };
    onChange(newVariables);
  };

  const handleRemoveVariable = (key: string): void => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [key]: _removed, ...remainingVariables } = variables;
    onChange(remainingVariables);
  };

  const handleNameChange = (oldKey: string, newKey: string): void => {
    if (oldKey === newKey) return;

    const newVariables: Record<string, number> = {};
    Object.entries(variables).forEach(([k, v]) => {
      if (k === oldKey) {
        newVariables[newKey] = v;
      } else {
        newVariables[k] = v;
      }
    });
    onChange(newVariables);
  };

  const handleValueChange = (key: string, value: number): void => {
    const newVariables = { ...variables, [key]: value };
    onChange(newVariables);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">{title}</Typography>

      {variableEntries.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No variables defined
        </Typography>
      )}

      {variableEntries.map(([key, value], index) => (
        <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            label="Variable Name"
            value={key}
            onChange={(e): void => handleNameChange(key, e.target.value)}
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Value"
            type="number"
            value={value}
            onChange={(e): void => handleValueChange(key, parseFloat(e.target.value) || 0)}
            size="small"
            sx={{ flex: 1 }}
            inputProps={{ step: 1 }}
          />
          <IconButton
            size="small"
            color="error"
            onClick={(): void => handleRemoveVariable(key)}
            aria-label="Remove variable"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}

      <Button
        startIcon={<AddIcon />}
        onClick={handleAddVariable}
        variant="outlined"
        size="small"
        sx={{ alignSelf: 'flex-start' }}
      >
        Add Variable
      </Button>
    </Stack>
  );
}
