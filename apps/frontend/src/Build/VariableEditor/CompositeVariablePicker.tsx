/**
 * Picker for selecting composite variables to add to templates
 */

import type { CompositeUnitDefinition } from '@about-time/types/composite';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';

interface CompositeVariablePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (data: {
    compositeId: string;
    count: number;
    storageType: 'snapshot' | 'live-link';
    countConfidence?: number;
  }) => void;
  userComposites: CompositeUnitDefinition[];
  publicComposites?: CompositeUnitDefinition[];
}

export function CompositeVariablePicker({
  open,
  onClose,
  onSelect,
  userComposites,
  publicComposites = [],
}: CompositeVariablePickerProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComposite, setSelectedComposite] = useState<CompositeUnitDefinition | null>(null);
  const [count, setCount] = useState(1);
  const [countConfidence, setCountConfidence] = useState(0);
  const [storageType, setStorageType] = useState<'snapshot' | 'live-link'>('snapshot');

  const filteredUserComposites = userComposites.filter(
    (composite) => composite.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredPublicComposites = publicComposites.filter(
    (composite) => composite.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCompositeSelect = (composite: CompositeUnitDefinition): void => {
    setSelectedComposite(composite);
  };

  const handleBack = (): void => {
    setSelectedComposite(null);
  };

  const handleAdd = (): void => {
    if (!selectedComposite) return;

    onSelect({
      compositeId: selectedComposite.id,
      count,
      storageType,
      countConfidence: countConfidence > 0 ? countConfidence / 100 : undefined,
    });

    onClose();
  };

  const renderCompositeCard = (composite: CompositeUnitDefinition, isPublic: boolean): React.ReactElement => {
    const compositionArray = Object.entries(composite.composition);

    return (
      <Card
        key={composite.id}
        sx={{
          marginBottom: 2,
          border: selectedComposite?.id === composite.id ? 2 : 0,
          borderColor: 'primary.main',
        }}
      >
        <CardActionArea onClick={(): void => handleCompositeSelect(composite)}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 1 }}>
              <Typography variant="h6">{composite.name}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {isPublic && <Chip label="Public" size="small" color="secondary" />}
                <Chip label={`v${composite.version}`} size="small" />
              </Box>
            </Box>

            {composite.changelog && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', marginBottom: 1 }}>
                {composite.changelog}
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {compositionArray.map(([varName, value]) => (
                <Chip
                  key={varName}
                  label={`${varName}: ${value.value}${value.lower !== undefined ? ` (${value.lower}-${value.upper})` : ''}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  };

  return (
    <Dialog key={open ? 'open' : 'closed'} fullScreen open={open} onClose={onClose}>
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={selectedComposite ? handleBack : onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ marginLeft: 2, flex: 1 }} variant="h6" component="div">
            {selectedComposite ? 'Configure Composite' : 'Select Composite Unit'}
          </Typography>
        </Toolbar>
      </AppBar>

      <DialogContent>
        <Container maxWidth="md" sx={{ paddingTop: 3, paddingBottom: 3 }}>
          {!selectedComposite ? (
            <>
              <TextField
                fullWidth
                placeholder="Search composites..."
                value={searchQuery}
                onChange={(e): void => setSearchQuery(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ marginBottom: 3 }}
              />

              {filteredUserComposites.length > 0 && (
                <Box sx={{ marginBottom: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Your Composites
                  </Typography>
                  {filteredUserComposites.map((composite) => renderCompositeCard(composite, false))}
                </Box>
              )}

              {filteredPublicComposites.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Public Composites
                  </Typography>
                  {filteredPublicComposites.map((composite) => renderCompositeCard(composite, true))}
                </Box>
              )}

              {filteredUserComposites.length === 0 && filteredPublicComposites.length === 0 && (
                <Box sx={{ textAlign: 'center', paddingTop: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No composites found
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <>
              <Box sx={{ marginBottom: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedComposite.name} (v{selectedComposite.version})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', marginBottom: 2 }}>
                  {Object.entries(selectedComposite.composition).map(([varName, value]) => (
                    <Chip
                      key={varName}
                      label={`${varName}: ${value.value}${value.lower !== undefined ? ` (${value.lower}-${value.upper})` : ''}`}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>

              <Box sx={{ marginBottom: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Count"
                  value={count}
                  onChange={(e): void => setCount(Math.max(1, parseFloat(e.target.value) || 1))}
                  helperText="How many times to multiply this composite"
                  inputProps={{ min: 1, step: 0.5 }}
                />
              </Box>

              <Box sx={{ marginBottom: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Confidence in Count (%)"
                  value={countConfidence}
                  onChange={(e): void => setCountConfidence(Math.max(0, parseFloat(e.target.value) || 0))}
                  helperText="Optional: Uncertainty in the count value (0% = exact)"
                  inputProps={{ min: 0, max: 100, step: 1 }}
                />
              </Box>

              <FormControl component="fieldset" sx={{ marginBottom: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Storage Type
                </Typography>
                <RadioGroup
                  value={storageType}
                  onChange={(e): void => setStorageType(e.target.value as 'snapshot' | 'live-link')}
                >
                  <FormControlLabel
                    value="snapshot"
                    control={<Radio />}
                    label={`Snapshot (Lock to v${selectedComposite.version})`}
                  />
                  <FormHelperText sx={{ marginLeft: 4, marginTop: 0 }}>
                    Freezes current values. Won't change if composite is updated.
                  </FormHelperText>

                  <FormControlLabel
                    value="live-link"
                    control={<Radio />}
                    label="Live Link (Always latest)"
                  />
                  <FormHelperText sx={{ marginLeft: 4, marginTop: 0 }}>
                    Automatically updates when the composite definition changes.
                  </FormHelperText>
                </RadioGroup>
              </FormControl>
            </>
          )}
        </Container>
      </DialogContent>

      {selectedComposite && (
        <DialogActions sx={{ padding: 2 }}>
          <Button onClick={handleBack}>Back</Button>
          <Button onClick={handleAdd} variant="contained">
            Add to Template
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
