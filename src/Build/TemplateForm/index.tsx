import CloseIcon from '@mui/icons-material/Close';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import IconButton from '@mui/material/IconButton';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import type { BusyTemplate, LaneTemplate } from '@tannerbroberts/about-time-core';
import React from 'react';

import { useBuildStore } from '../store';
import { validateTemplateForm } from '../utils/validation';

import { BasicInfoFields } from './BasicInfoFields';
import { VariableEditor } from './VariableEditor';

export function TemplateForm(): React.ReactElement {
  const isTemplateFormOpen = useBuildStore((state) => state.isTemplateFormOpen);
  const editingTemplateId = useBuildStore((state) => state.editingTemplateId);
  const templates = useBuildStore((state) => state.templates);
  const closeTemplateForm = useBuildStore((state) => state.closeTemplateForm);
  const createTemplate = useBuildStore((state) => state.createTemplate);
  const updateTemplate = useBuildStore((state) => state.updateTemplate);

  const editingTemplate = editingTemplateId
    ? (templates[editingTemplateId] as BusyTemplate | LaneTemplate | undefined)
    : undefined;

  // Form state
  const [templateType, setTemplateType] = React.useState<'busy' | 'lane'>('busy');
  const [name, setName] = React.useState('');
  const [durationMinutes, setDurationMinutes] = React.useState(0);
  const [willProduce, setWillProduce] = React.useState<Record<string, number>>({});
  const [willConsume, setWillConsume] = React.useState<Record<string, number>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Ref for focusing name input
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  // Reset form when dialog opens/closes or when editing template changes
  React.useEffect(() => {
    if (isTemplateFormOpen && editingTemplate) {
      setTemplateType(editingTemplate.templateType);
      setName(editingTemplate.intent);
      setDurationMinutes(Math.round(editingTemplate.estimatedDuration / 60000));
      if (editingTemplate.templateType === 'busy') {
        setWillProduce(editingTemplate.willProduce || {});
        setWillConsume(editingTemplate.willConsume || {});
      } else {
        setWillProduce({});
        setWillConsume({});
      }
    } else if (isTemplateFormOpen) {
      // Clear form for new template
      setTemplateType('busy');
      setName('');
      setDurationMinutes(0);
      setWillProduce({});
      setWillConsume({});
    }
    setErrors({});
  }, [isTemplateFormOpen, editingTemplate]);

  const handleTemplateTypeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setTemplateType(e.target.value as 'busy' | 'lane');
    // Focus name input after selecting template type
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);
  };

  const handleClose = (): void => {
    closeTemplateForm();
  };

  const handleFieldChange = (field: string, value: string | number): void => {
    if (field === 'name') {
      setName(value as string);
    } else if (field === 'durationMinutes') {
      setDurationMinutes(value as number);
    }
  };

  const handleSave = (): void => {
    const validation = validateTemplateForm({ name, durationMinutes });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const templateId = editingTemplateId || crypto.randomUUID();

    if (templateType === 'busy') {
      const template: BusyTemplate = {
        id: templateId,
        templateType: 'busy',
        intent: name,
        authorId: 'local-user', // TODO: Replace with actual user ID
        estimatedDuration: durationMinutes * 60000, // Convert minutes to ms
        references: [],
        willProduce: Object.keys(willProduce).length > 0 ? willProduce : {},
        willConsume: Object.keys(willConsume).length > 0 ? willConsume : {},
      };

      if (editingTemplateId) {
        updateTemplate(editingTemplateId, template);
      } else {
        createTemplate(template);
      }
    } else {
      const template: LaneTemplate = {
        id: templateId,
        templateType: 'lane',
        intent: name,
        authorId: 'local-user', // TODO: Replace with actual user ID
        estimatedDuration: durationMinutes * 60000, // Convert minutes to ms
        references: [],
        segments: [],
      };

      if (editingTemplateId) {
        updateTemplate(editingTemplateId, template);
      } else {
        createTemplate(template);
      }
    }

    closeTemplateForm();
  };

  return (
    <Dialog fullScreen open={isTemplateFormOpen} onClose={handleClose}>
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ marginLeft: 2, flex: 1 }} variant="h6" component="div">
            {editingTemplateId ? 'Edit Template' : 'Create Template'}
          </Typography>
        </Toolbar>
      </AppBar>

      <DialogContent sx={{ paddingBottom: '80px' }}>
        <Stack spacing={4} sx={{ maxWidth: 600, margin: '0 auto', paddingTop: 2 }}>
          {!editingTemplateId && (
            <FormControl>
              <FormLabel id="template-type-label">Template Type</FormLabel>
              <RadioGroup
                aria-labelledby="template-type-label"
                value={templateType}
                onChange={handleTemplateTypeChange}
              >
                <FormControlLabel
                  value="busy"
                  control={<Radio />}
                  label="Busy Template - Individual meal or activity with nutritional values"
                />
                <FormControlLabel
                  value="lane"
                  control={<Radio />}
                  label="Lane Template - Container for organizing multiple templates"
                />
              </RadioGroup>
            </FormControl>
          )}

          <BasicInfoFields
            name={name}
            durationMinutes={durationMinutes}
            errors={errors}
            onChange={handleFieldChange}
            onSubmit={handleSave}
            nameInputRef={nameInputRef}
          />

          {templateType === 'busy' && (
            <>
              <VariableEditor
                title="Will Produce"
                variables={willProduce}
                onChange={setWillProduce}
              />
              <VariableEditor
                title="Will Consume"
                variables={willConsume}
                onChange={setWillConsume}
              />
            </>
          )}

          {templateType === 'lane' && (
            <Typography variant="body2" color="text.secondary">
              Lane templates act as containers. After creating, use the template editor to add segments.
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          padding: 2,
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          zIndex: 1,
        }}
      >
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {editingTemplateId ? 'Save Changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
