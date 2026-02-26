import type { Template } from '@tannerbroberts/about-time-core';
import { useMemo } from 'react';

import type { FocusPathItem } from '../../store';
import { wouldCreateCircularDependency } from '../../utils/circularDependency';
import { calculateEmptyRegions } from '../../utils/emptyRegions';

export interface ActionContext {
  focusedLineage: FocusPathItem[];
  templates: Record<string, Template>;
}

export interface ActionAvailability {
  // Add actions
  canAdd: boolean;
  addDisabledReason?: string;

  // Edit actions
  canDuplicate: boolean;
  canAdjustOffset: boolean;
  adjustOffsetDisabledReason?: string;
  canRemoveSegment: boolean;
  removeSegmentDisabledReason?: string;

  // Layout actions
  canUseLayout: boolean;
  layoutDisabledReason?: string;

  // Navigate actions
  canFocusParent: boolean;
  focusParentDisabledReason?: string;
  canFocusSegment: boolean;
  focusSegmentDisabledReason?: string;
  canChangeBaseTemplate: boolean;
}

export function useContextActions(context: ActionContext): ActionAvailability {
  return useMemo(() => {
    const { focusedLineage, templates } = context;

    if (focusedLineage.length === 0) {
      return {
        canAdd: false,
        addDisabledReason: 'No template selected',
        canDuplicate: false,
        canAdjustOffset: false,
        adjustOffsetDisabledReason: 'No template selected',
        canRemoveSegment: false,
        removeSegmentDisabledReason: 'No template selected',
        canUseLayout: false,
        layoutDisabledReason: 'No template selected',
        canFocusParent: false,
        focusParentDisabledReason: 'Already at root',
        canFocusSegment: false,
        focusSegmentDisabledReason: 'No template selected',
        canChangeBaseTemplate: true,
      };
    }

    const focusedItem = focusedLineage[focusedLineage.length - 1];
    const template = templates[focusedItem.templateId];
    const isSegment = focusedItem.offset !== undefined;
    const isLane = template?.templateType === 'lane';

    // Add actions: enabled when focused template is a Lane AND there are templates that would fit
    let canAdd = false;
    let addDisabledReason = 'Only lane templates can have segments added';

    if (isLane && template.templateType === 'lane') {
      // Calculate available gaps in the lane
      const emptyRegions = calculateEmptyRegions(
        template.segments,
        template.estimatedDuration,
        templates,
      );

      // Check if any templates in the library would fit in any of the gaps
      const hasTemplatesThatFit = Object.values(templates).some((t) => {
        // Check if template would fit in any gap
        const fitsInAnyGap = emptyRegions.some((region) => {
          const gapDuration = region.end - region.start;
          return t.estimatedDuration <= gapDuration;
        });

        if (!fitsInAnyGap) {
          return false;
        }

        // Check for circular dependency
        if (wouldCreateCircularDependency(focusedItem.templateId, t.id, templates)) {
          return false;
        }

        return true;
      });

      canAdd = hasTemplatesThatFit;
      addDisabledReason = hasTemplatesThatFit
        ? ''
        : 'No templates fit in the available gaps';
    }

    // Edit actions
    const canDuplicate = true; // Always enabled
    const canAdjustOffset = isSegment;
    const adjustOffsetDisabledReason = 'Only segments can have their offset adjusted';
    const canRemoveSegment = isSegment;
    const removeSegmentDisabledReason = 'Cannot remove the base template';

    // Layout actions: enabled when focused template is a Lane
    const canUseLayout = isLane;
    const layoutDisabledReason = 'Layout operations only apply to lane templates';

    // Navigate actions
    const canFocusParent = focusedLineage.length > 1;
    const focusParentDisabledReason = 'Already at root';
    const canFocusSegment = isLane && template.templateType === 'lane' && template.segments.length > 0;
    const focusSegmentDisabledReason = !isLane
      ? 'Only lane templates have segments'
      : 'This lane has no segments';
    const canChangeBaseTemplate = true; // Always enabled

    return {
      canAdd,
      addDisabledReason,
      canDuplicate,
      canAdjustOffset,
      adjustOffsetDisabledReason,
      canRemoveSegment,
      removeSegmentDisabledReason,
      canUseLayout,
      layoutDisabledReason,
      canFocusParent,
      focusParentDisabledReason,
      canFocusSegment,
      focusSegmentDisabledReason,
      canChangeBaseTemplate,
    };
  }, [context]);
}
