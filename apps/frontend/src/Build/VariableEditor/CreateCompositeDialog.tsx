/**
 * Dialog for creating composite variable definitions
 */

import type { ValueWithConfidence } from '@about-time/types/confidence';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';

import { ConfidenceInput } from '../TemplateForm/ConfidenceInput';

interface ComponentVariable {
  id: string;
  name: string;
  value: ValueWithConfidence;
}

interface CreateCompositeDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    composition: Record<string, ValueWithConfidence>;
    isPublic: boolean;
    changelog?: string;
  }) => Promise<void>;
}

export function CreateCompositeDialog({
  open,
  onClose,
  onSave,
}: CreateCompositeDialogProps): React.ReactElement {
  const [compositeName, setCompositeName] = useState('');
  const [nameError, setNameError] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [changelog, setChangelog] = useState('Initial version');
  const [components, setComponents] = useState<ComponentVariable[]>([
    { id: '1', name: '', value: { value: 0 } },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddComponent = (): void => {
    const newId = String(Date.now());
    setComponents([...components, { id: newId, name: '', value: { value: 0 } }]);
  };

  const handleRemoveComponent = (id: string): void => {
    if (components.length > 1) {
      setComponents(components.filter((c) => c.id !== id));
    }
  };

  const handleComponentNameChange = (id: string, name: string): void => {
    setComponents(components.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const handleComponentValueChange = (id: string, value: number | ValueWithConfidence): void => {
    setComponents(components.map((c) => (c.id === id ? { ...c, value: typeof value === 'number' ? { value } : value } : c)));
  };

  const validateForm = (): boolean => {
    // Validate name
    if (!compositeName.trim()) {
      setNameError('Name is required');
      return false;
    }

    if (compositeName.length > 255) {
      setNameError('Name must be 255 characters or less');
      return false;
    }

    // Check for valid variable name format
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(compositeName)) {
      setNameError('Name must start with a letter and contain only letters, numbers, and underscores');
      return false;
    }

    setNameError('');

    // Validate components
    const componentNames = components.map((c) => c.name.trim());
    if (componentNames.some((name) => !name)) {
      return false;
    }

    // Check for duplicate component names
    const uniqueNames = new Set(componentNames);
    if (uniqueNames.size !== componentNames.length) {
      return false;
    }

    return true;
  };

  const handleSave = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // Build composition object
      const composition: Record<string, ValueWithConfidence> = {};
      for (const component of components) {
        composition[component.name.trim()] = component.value;
      }

      await onSave({
        name: compositeName.trim(),
        composition,
        isPublic: visibility === 'public',
        changelog: changelog.trim() || undefined,
      });

      // Reset form
      setCompositeName('');
      setComponents([{ id: '1', name: '', value: { value: 0 } }]);
      setVisibility('private');
      setChangelog('Initial version');
      setNameError('');
      onClose();
    } catch (error) {
      console.error('Failed to create composite:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = (): void => {
    setCompositeName('');
    setComponents([{ id: '1', name: '', value: { value: 0 } }]);
    setVisibility('private');
    setChangelog('Initial version');
    setNameError('');
    onClose();
  };

  return (
    <Dialog fullScreen open={open} onClose={handleClose}>
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close" disabled={isSaving}>
            <CloseIcon />
          </IconButton>
          <Typography sx={{ marginLeft: 2, flex: 1 }} variant="h6" component="div">
            Create Composite Unit
          </Typography>
        </Toolbar>
      </AppBar>

      <DialogContent>
        <Container maxWidth="md" sx={{ paddingTop: 3, paddingBottom: 3 }}>
          <Box sx={{ marginBottom: 3 }}>
            <TextField
              fullWidth
              label="Composite Name"
              value={compositeName}
              onChange={(e): void => setCompositeName(e.target.value)}
              error={!!nameError}
              helperText={nameError || 'Example: perfect_portion, complete_meal'}
              disabled={isSaving}
            />
          </Box>

          <Typography variant="h6" gutterBottom>
            Composition
          </Typography>

          <TableContainer component={Paper} sx={{ marginBottom: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Variable Name</TableCell>
                  <TableCell>Value (with Confidence)</TableCell>
                  <TableCell align="right" sx={{ width: 80 }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {components.map((component) => (
                  <TableRow key={component.id}>
                    <TableCell>
                      <TextField
                        size="small"
                        placeholder="e.g., protein_g, calories"
                        value={component.name}
                        onChange={(e): void => handleComponentNameChange(component.id, e.target.value)}
                        disabled={isSaving}
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <ConfidenceInput
                        label=""
                        value={component.value}
                        onChange={(val): void => handleComponentValueChange(component.id, val)}
                        disabled={isSaving}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(): void => handleRemoveComponent(component.id)}
                        disabled={components.length === 1 || isSaving}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button
            startIcon={<AddIcon />}
            onClick={handleAddComponent}
            variant="outlined"
            disabled={isSaving}
            sx={{ marginBottom: 3 }}
          >
            Add Variable
          </Button>

          <Box sx={{ marginBottom: 3 }}>
            <FormControl component="fieldset">
              <Typography variant="subtitle2" gutterBottom>
                Visibility
              </Typography>
              <RadioGroup
                row
                value={visibility}
                onChange={(e): void => setVisibility(e.target.value as 'private' | 'public')}
              >
                <FormControlLabel
                  value="private"
                  control={<Radio />}
                  label="Private"
                  disabled={isSaving}
                />
                <FormControlLabel
                  value="public"
                  control={<Radio />}
                  label="Public"
                  disabled={isSaving}
                />
              </RadioGroup>
              <FormHelperText>
                Private composites are only visible to you. Public composites can be used by anyone.
              </FormHelperText>
            </FormControl>
          </Box>

          <Box sx={{ marginBottom: 3 }}>
            <TextField
              fullWidth
              label="Changelog (Optional)"
              value={changelog}
              onChange={(e): void => setChangelog(e.target.value)}
              multiline
              rows={2}
              disabled={isSaving}
              helperText="Describe this version of the composite"
            />
          </Box>

          <Paper sx={{ padding: 2, backgroundColor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="body2">
              ℹ️ This creates a reusable unit definition you can use in any template. For example, if you create a
              "perfect_portion" composite, you can reference it multiple times in your templates and update all
              instances by updating the composite definition.
            </Typography>
          </Paper>
        </Container>
      </DialogContent>

      <DialogActions sx={{ padding: 2 }}>
        <Button onClick={handleClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={isSaving}>
          {isSaving ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
