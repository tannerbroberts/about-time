import CloseIcon from '@mui/icons-material/Close';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import type { BusyTemplate } from '@tannerbroberts/about-time-core';
import React from 'react';

import { useBuildContext } from '../useContext';
import { validateTemplateForm } from '../utils/validation';

import { BasicInfoFields } from './BasicInfoFields';
import { MacroFields } from './MacroFields';
import { ResourceFields } from './ResourceFields';

export function TemplateForm(): React.ReactElement {
  const { state, dispatch } = useBuildContext();
  const { isTemplateFormOpen, editingTemplateId, templates } = state;

  const editingTemplate = editingTemplateId ? (templates[editingTemplateId] as BusyTemplate | undefined) : undefined;

  // Form state
  const [name, setName] = React.useState('');
  const [durationMinutes, setDurationMinutes] = React.useState(0);
  const [calories, setCalories] = React.useState<number | undefined>(undefined);
  const [protein_g, setProteinG] = React.useState<number | undefined>(undefined);
  const [carbs_g, setCarbsG] = React.useState<number | undefined>(undefined);
  const [fats_g, setFatsG] = React.useState<number | undefined>(undefined);
  const [prep_time, setPrepTime] = React.useState<number | undefined>(undefined);
  const [cost, setCost] = React.useState<number | undefined>(undefined);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or when editing template changes
  React.useEffect(() => {
    if (isTemplateFormOpen && editingTemplate) {
      setName(editingTemplate.intent);
      setDurationMinutes(Math.round(editingTemplate.estimatedDuration / 60000));
      setCalories(editingTemplate.willProduce?.calories);
      setProteinG(editingTemplate.willProduce?.protein_g);
      setCarbsG(editingTemplate.willProduce?.carbs_g);
      setFatsG(editingTemplate.willProduce?.fats_g);
      setPrepTime(editingTemplate.willConsume?.prep_time ? Math.round(editingTemplate.willConsume.prep_time / 60000) : undefined);
      setCost(editingTemplate.willConsume?.cost ? editingTemplate.willConsume.cost / 100 : undefined);
    } else if (isTemplateFormOpen) {
      // Clear form for new template
      setName('');
      setDurationMinutes(0);
      setCalories(undefined);
      setProteinG(undefined);
      setCarbsG(undefined);
      setFatsG(undefined);
      setPrepTime(undefined);
      setCost(undefined);
    }
    setErrors({});
  }, [isTemplateFormOpen, editingTemplate]);

  const handleClose = (): void => {
    dispatch({ type: 'CLOSE_TEMPLATE_FORM' });
  };

  const handleFieldChange = (field: string, value: string | number | undefined): void => {
    switch (field) {
      case 'name':
        setName(value as string);
        break;
      case 'durationMinutes':
        setDurationMinutes(value as number);
        break;
      case 'calories':
        setCalories(value as number | undefined);
        break;
      case 'protein_g':
        setProteinG(value as number | undefined);
        break;
      case 'carbs_g':
        setCarbsG(value as number | undefined);
        break;
      case 'fats_g':
        setFatsG(value as number | undefined);
        break;
      case 'prep_time':
        setPrepTime(value as number | undefined);
        break;
      case 'cost':
        setCost(value as number | undefined);
        break;
    }
  };

  const handleSave = (): void => {
    const formData = {
      name,
      durationMinutes,
      calories,
      protein_g,
      carbs_g,
      fats_g,
      prep_time,
      cost,
    };

    const validation = validateTemplateForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Build willProduce object
    const willProduce: BusyTemplate['willProduce'] = {};
    if (calories !== undefined) willProduce.calories = calories;
    if (protein_g !== undefined) willProduce.protein_g = protein_g;
    if (carbs_g !== undefined) willProduce.carbs_g = carbs_g;
    if (fats_g !== undefined) willProduce.fats_g = fats_g;

    // Build willConsume object
    const willConsume: BusyTemplate['willConsume'] = {};
    if (prep_time !== undefined) willConsume.prep_time = prep_time * 60000; // Convert minutes to ms
    if (cost !== undefined) willConsume.cost = Math.round(cost * 100); // Convert dollars to cents

    const template: BusyTemplate = {
      id: editingTemplateId || crypto.randomUUID(),
      type: 'BusyTemplate',
      intent: name,
      estimatedDuration: durationMinutes * 60000, // Convert minutes to ms
      willProduce: Object.keys(willProduce).length > 0 ? willProduce : undefined,
      willConsume: Object.keys(willConsume).length > 0 ? willConsume : undefined,
    };

    if (editingTemplateId) {
      dispatch({ type: 'UPDATE_TEMPLATE', id: editingTemplateId, template });
    } else {
      dispatch({ type: 'CREATE_TEMPLATE', template });
    }
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

      <DialogContent>
        <Stack spacing={4} sx={{ maxWidth: 600, margin: '0 auto', paddingTop: 2 }}>
          <BasicInfoFields
            name={name}
            durationMinutes={durationMinutes}
            errors={errors}
            onChange={handleFieldChange}
          />
          <MacroFields
            calories={calories}
            protein_g={protein_g}
            carbs_g={carbs_g}
            fats_g={fats_g}
            errors={errors}
            onChange={handleFieldChange}
          />
          <ResourceFields
            prep_time={prep_time}
            cost={cost}
            errors={errors}
            onChange={handleFieldChange}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ padding: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {editingTemplateId ? 'Save Changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
