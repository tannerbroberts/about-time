import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GridViewIcon from '@mui/icons-material/GridView';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import type { LaneTemplate, Template } from '@tannerbroberts/about-time-core';
import {
  equallyDistributeSegments,
  fitLaneDurationToLast,
  packSegments,
} from '@tannerbroberts/about-time-core';
import React from 'react';

import { useBuildStore } from '../../store';
import { calculateEmptyRegions } from '../../utils/emptyRegions';
import { NOTIFICATION_DURATIONS, NOTIFICATION_MESSAGES } from '../../utils/notifications';

import { useContextActions } from './useContextActions';

export function ActionTreeMenu(): React.ReactElement {
  const isActionMenuOpen = useBuildStore((state) => state.isActionMenuOpen);
  const actionMenuPosition = useBuildStore((state) => state.actionMenuPosition);
  const focusedLineage = useBuildStore((state) => state.focusedLineage);
  const templates = useBuildStore((state) => state.templates);
  const openSegmentAddModal = useBuildStore((state) => state.openSegmentAddModal);
  const openTemplateForm = useBuildStore((state) => state.openTemplateForm);
  const createTemplate = useBuildStore((state) => state.createTemplate);
  const updateTemplate = useBuildStore((state) => state.updateTemplate);
  const setFocusedLineage = useBuildStore((state) => state.setFocusedLineage);
  const showNotification = useBuildStore((state) => state.showNotification);
  const openBaseTemplateSelection = useBuildStore((state) => state.openBaseTemplateSelection);
  const closeActionMenu = useBuildStore((state) => state.closeActionMenu);

  const availability = useContextActions({ focusedLineage, templates });

  const [openCategory, setOpenCategory] = React.useState<string | null>(null);
  const [openSubMenu, setOpenSubMenu] = React.useState<string | null>(null);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        if (openSubMenu) {
          setOpenSubMenu(null);
        } else if (openCategory) {
          setOpenCategory(null);
        } else {
          closeActionMenu();
        }
      }
    };

    if (isActionMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return (): void => window.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [isActionMenuOpen, openCategory, openSubMenu, closeActionMenu]);

  if (!isActionMenuOpen || !actionMenuPosition) {
    return <></>;
  }

  const handleCategoryToggle = (category: string): void => {
    setOpenCategory(openCategory === category ? null : category);
    setOpenSubMenu(null);
  };

  const handleSubMenuToggle = (subMenu: string): void => {
    setOpenSubMenu(openSubMenu === subMenu ? null : subMenu);
  };

  // Action handlers
  const focusedItem = focusedLineage[focusedLineage.length - 1];
  const template = templates[focusedItem?.templateId];
  const parentLineage = focusedLineage.slice(0, -1);

  const handleSelectExisting = (): void => {
    if (focusedLineage.length === 0) {
      return;
    }

    const currentTemplate = templates[focusedItem.templateId];

    if (!currentTemplate || currentTemplate.templateType !== 'lane') {
      return;
    }

    const laneTemplate = currentTemplate as LaneTemplate;
    const emptyRegions = calculateEmptyRegions(
      laneTemplate.segments,
      laneTemplate.estimatedDuration,
      templates,
    );

    if (emptyRegions.length === 0) {
      return;
    }

    const largestGap = emptyRegions.reduce((largest, region) => {
      const regionSize = region.end - region.start;
      const largestSize = largest.end - largest.start;
      return regionSize > largestSize ? region : largest;
    });

    openSegmentAddModal(largestGap);
    closeActionMenu();
  };

  const handleDuplicate = (): void => {
    if (!template) {
      return;
    }

    const newId = crypto.randomUUID();
    const duplicatedTemplate: Template = {
      ...template,
      id: newId,
      intent: `${template.intent || 'Template'} (Copy)`,
    };
    createTemplate(duplicatedTemplate);

    const editAction = (
      <Button
        color="inherit"
        size="small"
        onClick={(): void => {
          openTemplateForm(newId);
        }}
      >
        EDIT
      </Button>
    );

    showNotification(
      NOTIFICATION_MESSAGES.TEMPLATE_DUPLICATED(duplicatedTemplate.intent || 'Template'),
      'success',
      NOTIFICATION_DURATIONS.MEDIUM,
      editAction,
    );
    closeActionMenu();
  };

  const handleRemoveSegment = (): void => {
    if (!availability.canRemoveSegment || !focusedItem) {
      return;
    }

    const parentItem = parentLineage[parentLineage.length - 1];
    if (!parentItem) {
      return;
    }

    const parentTemplate = templates[parentItem.templateId] as LaneTemplate;
    if (!parentTemplate || parentTemplate.templateType !== 'lane') {
      return;
    }

    if (window.confirm('Are you sure you want to delete this segment?')) {
      const updatedSegments = parentTemplate.segments.filter(
        (segment) => !(segment.templateId === focusedItem.templateId && segment.offset === focusedItem.offset),
      );

      updateTemplate(parentTemplate.id, {
        ...parentTemplate,
        segments: updatedSegments,
      });

      setFocusedLineage(parentLineage);
      closeActionMenu();
    }
  };

  const handlePackTightly = (): void => {
    if (!template || template.templateType !== 'lane') {
      return;
    }
    const result = packSegments(template.id, templates as Record<string, Template>);
    if (result) {
      updateTemplate(template.id, result);
      showNotification(NOTIFICATION_MESSAGES.LAYOUT_PACK_TIGHTLY, 'success', NOTIFICATION_DURATIONS.SHORT);
      closeActionMenu();
    }
  };

  const handleDistributeEvenly = (): void => {
    if (!template || template.templateType !== 'lane') {
      return;
    }
    const result = equallyDistributeSegments(template.id, templates as Record<string, Template>);
    if (result) {
      updateTemplate(template.id, result);
      showNotification(NOTIFICATION_MESSAGES.LAYOUT_DISTRIBUTE_EVENLY, 'success', NOTIFICATION_DURATIONS.SHORT);
      closeActionMenu();
    }
  };

  const handleFitToContent = (): void => {
    if (!template || template.templateType !== 'lane') {
      return;
    }
    const result = fitLaneDurationToLast(template.id, templates as Record<string, Template>);
    if (result) {
      updateTemplate(template.id, result);
      showNotification(NOTIFICATION_MESSAGES.LAYOUT_FIT_TO_CONTENT, 'success', NOTIFICATION_DURATIONS.SHORT);
      closeActionMenu();
    }
  };

  const renderIconButton = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    isOpen: boolean,
    hasSubmenu: boolean,
    disabled?: boolean,
    color?: string,
  ): React.ReactElement => {
    const defaultColor = color || '#3b82f6';
    const bgColor = isOpen ? defaultColor : 'transparent';

    let textColor = defaultColor;
    if (isOpen) {
      textColor = 'white';
    } else if (disabled) {
      textColor = '#9ca3af';
    } else {
      textColor = color || '#6b7280';
    }

    let hoverBg = 'rgba(0, 0, 0, 0.04)';
    if (disabled) {
      hoverBg = 'transparent';
    } else if (isOpen) {
      hoverBg = defaultColor;
    }

    return (
      <Tooltip title={disabled ? `${label} (unavailable)` : label} placement="right">
        <span>
          <IconButton
            onClick={onClick}
            disabled={disabled}
            sx={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              backgroundColor: bgColor,
              color: textColor,
              '&:hover': {
                backgroundColor: hoverBg,
              },
              transition: 'all 0.2s',
            }}
          >
            <Box sx={{ position: 'relative', width: '24px', height: '24px' }}>
              {icon}
              {hasSubmenu && (
                <Box
                  sx={{
                    position: 'absolute',
                    right: -4,
                    bottom: -4,
                    width: '12px',
                    height: '12px',
                    backgroundColor: 'background.paper',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isOpen ? <ExpandMoreIcon sx={{ fontSize: '10px' }} /> : <ChevronRightIcon sx={{ fontSize: '10px' }} />}
                </Box>
              )}
            </Box>
          </IconButton>
        </span>
      </Tooltip>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <Box
        onClick={closeActionMenu}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1300,
        }}
      />

      {/* Floating Menu */}
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          left: actionMenuPosition.x,
          top: actionMenuPosition.y,
          transform: 'translate(-50%, -50%)',
          zIndex: 1400,
          minWidth: '200px',
          maxWidth: '600px',
          overflow: 'visible',
          padding: 1.5,
        }}
      >
        {/* Horizontal bars stacked vertically (submenus appear above root) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Bar 3: Create New submenu (horizontal) - appears at top when open */}
          <Collapse in={openSubMenu === 'create-new'} timeout="auto" unmountOnExit>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, alignItems: 'center' }}>
              {renderIconButton(
                'Create Busy',
                <AddIcon fontSize="small" />,
                (): void => {
                  openTemplateForm(undefined, 'busy');
                  closeActionMenu();
                },
                false,
                false,
                false,
                '#10b981',
              )}
              {renderIconButton(
                'Create Lane',
                <AddIcon fontSize="small" />,
                (): void => {
                  openTemplateForm(undefined, 'lane');
                  closeActionMenu();
                },
                false,
                false,
                false,
                '#10b981',
              )}
            </Box>
          </Collapse>

          {/* Bar 2: Category submenus (horizontal) - appear above root */}
          <Collapse in={openCategory === 'add'} timeout="auto" unmountOnExit>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, alignItems: 'center' }}>
              {renderIconButton(
                'Create New',
                <AddIcon fontSize="small" />,
                () => handleSubMenuToggle('create-new'),
                openSubMenu === 'create-new',
                true,
                false,
                '#10b981',
              )}
              {renderIconButton(
                'Select Existing',
                <AddIcon fontSize="small" />,
                handleSelectExisting,
                false,
                false,
                false,
                '#10b981',
              )}
            </Box>
          </Collapse>

          <Collapse in={openCategory === 'edit'} timeout="auto" unmountOnExit>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, alignItems: 'center' }}>
              {renderIconButton(
                'Duplicate',
                <EditIcon fontSize="small" />,
                handleDuplicate,
                false,
                false,
                !availability.canDuplicate,
                '#3b82f6',
              )}
              {renderIconButton(
                'Remove',
                <CloseIcon fontSize="small" />,
                handleRemoveSegment,
                false,
                false,
                !availability.canRemoveSegment,
                '#ef4444',
              )}
            </Box>
          </Collapse>

          <Collapse in={openCategory === 'layout'} timeout="auto" unmountOnExit>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, alignItems: 'center' }}>
              {renderIconButton(
                'Pack',
                <GridViewIcon fontSize="small" />,
                handlePackTightly,
                false,
                false,
                !availability.canUseLayout,
                '#f59e0b',
              )}
              {renderIconButton(
                'Distribute',
                <GridViewIcon fontSize="small" />,
                handleDistributeEvenly,
                false,
                false,
                !availability.canUseLayout,
                '#f59e0b',
              )}
              {renderIconButton(
                'Fit',
                <GridViewIcon fontSize="small" />,
                handleFitToContent,
                false,
                false,
                !availability.canUseLayout,
                '#f59e0b',
              )}
              {renderIconButton(
                'Add Gap',
                <GridViewIcon fontSize="small" />,
                (): void => {},
                false,
                false,
                !availability.canUseLayout,
                '#f59e0b',
              )}
            </Box>
          </Collapse>

          <Collapse in={openCategory === 'navigate'} timeout="auto" unmountOnExit>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, alignItems: 'center' }}>
              {renderIconButton(
                'Focus Parent',
                <NavigateNextIcon fontSize="small" />,
                (): void => {
                  if (focusedLineage.length > 1) {
                    setFocusedLineage(focusedLineage.slice(0, -1));
                  }
                  closeActionMenu();
                },
                false,
                false,
                !availability.canFocusParent,
                '#8b5cf6',
              )}
              {renderIconButton(
                'Change Base',
                <NavigateNextIcon fontSize="small" />,
                (): void => {
                  openBaseTemplateSelection();
                  closeActionMenu();
                },
                false,
                false,
                !availability.canChangeBaseTemplate,
                '#8b5cf6',
              )}
            </Box>
          </Collapse>

          {/* Bar 1: Root categories (horizontal) - always at bottom */}
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, alignItems: 'center' }}>
            {renderIconButton('Add', <AddIcon />, () => handleCategoryToggle('add'), openCategory === 'add', true, false, '#10b981')}
            {renderIconButton('Edit', <EditIcon />, () => handleCategoryToggle('edit'), openCategory === 'edit', true, false, '#3b82f6')}
            {renderIconButton('Layout', <GridViewIcon />, () => handleCategoryToggle('layout'), openCategory === 'layout', true, false, '#f59e0b')}
            {renderIconButton('Navigate', <NavigateNextIcon />, () => handleCategoryToggle('navigate'), openCategory === 'navigate', true, false, '#8b5cf6')}
          </Box>
        </Box>

        {/* Close button centered at bottom */}
        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 1 }}>
          <IconButton size="small" onClick={closeActionMenu} aria-label="Close menu">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </>
  );
}
