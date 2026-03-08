import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import type { Template } from '@tannerbroberts/about-time-core';
import React, { useMemo, useState } from 'react';

type TemplateWithUsage = Template & {
  membershipId: string;
  usageCount: number;
  lastUsedAt: Date | null;
};

interface CleanupToolsProps {
  libraryId: string;
  templates: TemplateWithUsage[];
  onRemoveTemplates: (templateIds: string[]) => Promise<void>;
}

/**
 * Get human-readable time since last use
 */
function getTimeSinceLastUse(lastUsedAt: Date | null): string {
  if (!lastUsedAt) {
    return 'never used';
  }

  const now = new Date();
  const daysSince = Math.floor((now.getTime() - lastUsedAt.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSince === 0) {
    return 'used today';
  }
  if (daysSince === 1) {
    return 'used yesterday';
  }
  if (daysSince < 30) {
    return `used ${daysSince} days ago`;
  }
  if (daysSince < 365) {
    const months = Math.floor(daysSince / 30);
    return `used ${months} month${months > 1 ? 's' : ''} ago`;
  }

  const years = Math.floor(daysSince / 365);
  return `used ${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * Library cleanup tools for managing unused and stale templates
 */
export function CleanupTools({
  libraryId: _libraryId,
  templates,
  onRemoveTemplates,
}: CleanupToolsProps): React.ReactElement {
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    const neverUsed = templates.filter((t) => t.usageCount === 0);
    const notUsedRecently = templates.filter((t) => {
      if (!t.lastUsedAt) return true;
      const daysSince = (new Date().getTime() - t.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 90;
    });
    const avgUsage = templates.length > 0
      ? Math.round(templates.reduce((sum, t) => sum + t.usageCount, 0) / templates.length)
      : 0;

    return {
      total: templates.length,
      neverUsed: neverUsed.length,
      notUsedRecently: notUsedRecently.length,
      avgUsage,
      candidates: [...new Map([...neverUsed, ...notUsedRecently].map((t) => [t.id, t])).values()],
    };
  }, [templates]);

  const handleToggleTemplate = (templateId: string): void => {
    const newSelected = new Set(selectedTemplateIds);
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId);
    } else {
      newSelected.add(templateId);
    }
    setSelectedTemplateIds(newSelected);
  };

  const handleSelectAll = (): void => {
    if (selectedTemplateIds.size === stats.candidates.length) {
      setSelectedTemplateIds(new Set());
    } else {
      setSelectedTemplateIds(new Set(stats.candidates.map((t) => t.id)));
    }
  };

  const handleRemoveClick = (): void => {
    if (selectedTemplateIds.size === 0) return;
    setConfirmDialogOpen(true);
  };

  const handleConfirmRemove = async (): Promise<void> => {
    setIsRemoving(true);
    try {
      await onRemoveTemplates(Array.from(selectedTemplateIds));
      setSelectedTemplateIds(new Set());
      setConfirmDialogOpen(false);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCancelRemove = (): void => {
    setConfirmDialogOpen(false);
  };

  const allSelected = selectedTemplateIds.size === stats.candidates.length && stats.candidates.length > 0;

  return (
    <Card sx={{ marginTop: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Library Cleanup
        </Typography>

        {/* Stats Section */}
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            marginTop: 2,
            marginBottom: 3,
            padding: 2,
            backgroundColor: 'action.hover',
            borderRadius: 1,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total Templates
            </Typography>
            <Typography variant="h5">{stats.total}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Never Used
            </Typography>
            <Typography variant="h5" color="warning.main">
              {stats.neverUsed}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Not Used (90+ days)
            </Typography>
            <Typography variant="h5" color="error.main">
              {stats.notUsedRecently}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Avg. Usage
            </Typography>
            <Typography variant="h5">{stats.avgUsage}×</Typography>
          </Box>
        </Box>

        {/* Cleanup Candidates */}
        {stats.candidates.length > 0 ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Found {stats.candidates.length} template{stats.candidates.length > 1 ? 's' : ''} to review:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={handleSelectAll}>
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleRemoveClick}
                  disabled={selectedTemplateIds.size === 0}
                >
                  Remove Selected ({selectedTemplateIds.size})
                </Button>
              </Box>
            </Box>

            <List dense sx={{ maxHeight: 400, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {stats.candidates.map((template) => {
                const timeInfo = getTimeSinceLastUse(template.lastUsedAt);
                const isSelected = selectedTemplateIds.has(template.id);

                return (
                  <ListItem key={template.id} disablePadding>
                    <ListItemButton onClick={(): void => handleToggleTemplate(template.id)} dense>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={isSelected}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={template.intent}
                        secondary={`${timeInfo} • ${template.usageCount} use${template.usageCount !== 1 ? 's' : ''}`}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>

            <Box sx={{ marginTop: 2, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <InfoIcon color="info" fontSize="small" />
              <Typography variant="caption" color="text.secondary">
                Removing templates from this library will not delete them permanently.
                They will remain available in your template list and other libraries.
              </Typography>
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No cleanup needed! All templates are being used regularly.
          </Typography>
        )}
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCancelRemove}>
        <DialogTitle>Remove Templates from Library?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to remove {selectedTemplateIds.size} template{selectedTemplateIds.size > 1 ? 's' : ''} from this library.
          </DialogContentText>
          <DialogContentText sx={{ marginTop: 1, fontWeight: 'bold' }}>
            This will NOT delete the templates permanently. They will remain in your template list and can be added back to libraries later.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRemove} disabled={isRemoving}>
            Cancel
          </Button>
          <Button onClick={handleConfirmRemove} color="error" variant="contained" disabled={isRemoving}>
            {isRemoving ? 'Removing...' : 'Remove from Library'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
