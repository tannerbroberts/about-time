import AddBoxIcon from '@mui/icons-material/AddBox';
import CloseIcon from '@mui/icons-material/Close';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React from 'react';

import { useBuildStore } from '../../store';
import { wouldCreateCircularDependency } from '../../utils/circularDependency';

export function SegmentAddOverlay(): React.ReactElement {
  const isSegmentAddOverlayOpen = useBuildStore((state) => state.isSegmentAddOverlayOpen);
  const selectedRegion = useBuildStore((state) => state.selectedRegion);
  const overlayPosition = useBuildStore((state) => state.overlayPosition);
  const focusedLineage = useBuildStore((state) => state.focusedLineage);
  const templates = useBuildStore((state) => state.templates);
  const closeSegmentAddOverlay = useBuildStore((state) => state.closeSegmentAddOverlay);
  const openSegmentAddModal = useBuildStore((state) => state.openSegmentAddModal);

  const [isFillWithNewModalOpen, setIsFillWithNewModalOpen] = React.useState(false);

  const handleClose = (): void => {
    closeSegmentAddOverlay();
  };

  const handleSelectSegment = (): void => {
    if (!selectedRegion) {
      return;
    }
    closeSegmentAddOverlay();
    openSegmentAddModal(selectedRegion);
  };

  const handleFillWithNew = (): void => {
    setIsFillWithNewModalOpen(true);
  };

  const handleFillWithNewModalClose = (): void => {
    setIsFillWithNewModalOpen(false);
    closeSegmentAddOverlay();
  };

  // Check if there are any templates that fit in the selected region
  const hasAvailableTemplates = React.useMemo(() => {
    if (!selectedRegion || focusedLineage.length === 0) {
      return false;
    }

    const focusedItem = focusedLineage[focusedLineage.length - 1];
    const regionDuration = selectedRegion.end - selectedRegion.start;

    return Object.values(templates).some((template) => {
      // Filter by duration - template must fit in the region
      if (template.estimatedDuration > regionDuration) {
        return false;
      }

      // Filter by circular dependency
      if (wouldCreateCircularDependency(focusedItem.templateId, template.id, templates)) {
        return false;
      }

      return true;
    });
  }, [selectedRegion, focusedLineage, templates]);

  if (!isSegmentAddOverlayOpen || !overlayPosition) {
    return (
      <>
        {isFillWithNewModalOpen && selectedRegion && (
          <FillWithNewModal
            isOpen={isFillWithNewModalOpen}
            onClose={handleFillWithNewModalClose}
            start={selectedRegion.start}
            end={selectedRegion.end}
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <Box
        onClick={handleClose}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1300,
        }}
      />

      {/* Floating pill */}
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          left: overlayPosition.x,
          top: overlayPosition.y,
          transform: 'translate(-50%, -50%)',
          zIndex: 1400,
          borderRadius: '28px',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: '#2c2c2c',
        }}
      >
        <Tooltip title="Close">
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              width: 48,
              height: 48,
              backgroundColor: '#f59e0b',
              color: 'white',
              '&:hover': {
                backgroundColor: '#d97706',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title={hasAvailableTemplates ? 'Select from existing templates' : 'No templates fit in this duration'}>
          <span>
            <IconButton
              onClick={handleSelectSegment}
              disabled={!hasAvailableTemplates}
              size="small"
              sx={{
                width: 48,
                height: 48,
                backgroundColor: hasAvailableTemplates ? '#10b981' : '#4b5563',
                color: 'white',
                '&:hover': {
                  backgroundColor: hasAvailableTemplates ? '#059669' : '#4b5563',
                },
                '&:disabled': {
                  backgroundColor: '#4b5563',
                  color: '#9ca3af',
                },
              }}
            >
              <LibraryAddIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Create new template">
          <IconButton
            onClick={handleFillWithNew}
            size="small"
            sx={{
              width: 48,
              height: 48,
              backgroundColor: '#3b82f6',
              color: 'white',
              '&:hover': {
                backgroundColor: '#2563eb',
              },
            }}
          >
            <AddBoxIcon />
          </IconButton>
        </Tooltip>
      </Paper>

      {isFillWithNewModalOpen && selectedRegion && (
        <FillWithNewModal
          isOpen={isFillWithNewModalOpen}
          onClose={handleFillWithNewModalClose}
          start={selectedRegion.start}
          end={selectedRegion.end}
        />
      )}
    </>
  );
}

interface FillWithNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  start: number;
  end: number;
}

function FillWithNewModal({ isOpen, onClose, start, end }: FillWithNewModalProps): React.ReactElement {
  const focusedLineage = useBuildStore((state) => state.focusedLineage);
  const templates = useBuildStore((state) => state.templates);
  const createTemplate = useBuildStore((state) => state.createTemplate);
  const updateTemplate = useBuildStore((state) => state.updateTemplate);
  const toggleAddSegmentMode = useBuildStore((state) => state.toggleAddSegmentMode);

  const duration = end - start;
  const durationMinutes = Math.round(duration / 60000);

  const [templateType, setTemplateType] = React.useState<'busy' | 'lane'>('busy');
  const [name, setName] = React.useState('');
  const [customDuration, setCustomDuration] = React.useState(durationMinutes);
  const [offset, setOffset] = React.useState(start);
  const [error, setError] = React.useState('');

  const handleCreate = (): void => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (customDuration <= 0) {
      setError('Duration must be greater than 0');
      return;
    }

    if (offset < start || offset > end) {
      setError(`Offset must be between ${start} and ${end}`);
      return;
    }

    const templateId = crypto.randomUUID();
    const estimatedDuration = customDuration * 60000;

    // Create the template
    if (templateType === 'busy') {
      createTemplate({
        id: templateId,
        templateType: 'busy',
        intent: name,
        authorId: 'local-user',
        estimatedDuration,
        references: [],
        willProduce: {},
        willConsume: {},
      });
    } else {
      createTemplate({
        id: templateId,
        templateType: 'lane',
        intent: name,
        authorId: 'local-user',
        estimatedDuration,
        references: [],
        segments: [],
      });
    }

    // Add the template as a segment to the focused lane
    const focusedItem = focusedLineage[focusedLineage.length - 1];
    const focusedTemplate = templates[focusedItem.templateId];

    if (focusedTemplate && focusedTemplate.templateType === 'lane') {
      const laneTemplate = focusedTemplate;
      const newSegment = {
        templateId,
        offset,
        relationshipId: crypto.randomUUID(),
      };

      updateTemplate(laneTemplate.id, {
        ...laneTemplate,
        segments: [...laneTemplate.segments, newSegment],
      });
    }

    // Exit add segment mode
    toggleAddSegmentMode();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Fill with New Template</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ paddingTop: 2 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Template Type
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant={templateType === 'busy' ? 'contained' : 'outlined'}
                onClick={(): void => setTemplateType('busy')}
                fullWidth
              >
                Busy
              </Button>
              <Button
                variant={templateType === 'lane' ? 'contained' : 'outlined'}
                onClick={(): void => setTemplateType('lane')}
                fullWidth
              >
                Lane
              </Button>
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Name
            </Typography>
            <input
              type="text"
              value={name}
              onChange={(e): void => setName(e.target.value)}
              placeholder="Template name"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Duration (minutes)
            </Typography>
            <input
              type="number"
              value={customDuration}
              onChange={(e): void => setCustomDuration(Number(e.target.value))}
              min={0}
              max={durationMinutes}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ marginTop: 0.5, display: 'block' }}>
              Available space: {durationMinutes} minutes
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Offset (ms)
            </Typography>
            <input
              type="number"
              value={offset}
              onChange={(e): void => setOffset(Number(e.target.value))}
              min={start}
              max={end}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ marginTop: 0.5, display: 'block' }}>
              Range: {start} - {end} ms
            </Typography>
          </Box>

          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="contained" onClick={handleCreate}>
              Create & Add
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
