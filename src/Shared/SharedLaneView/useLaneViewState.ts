import { useMemo, useState, useCallback } from 'react';

import type { Template, LaneTemplate, Segment } from '../../App';

import { calculateLedgerConfig, type LedgerConfig } from './calculateLedgerConfig';

/**
 * Minimum ratio of child duration to parent duration for rendering.
 * Children smaller than 1/20th (5%) of parent are hidden.
 */
const MIN_VISIBILITY_RATIO = 1 / 20;

/**
 * Number of time slots used for grouping hidden children indicators.
 * The parent lane is divided into 20 equal slots.
 */
const TIME_SLOTS = 20;

interface VisibleSegment {
  templateId: string;
  template: Template;
  offset: number;
  duration: number;
}

interface HiddenChildrenSlot {
  slotIndex: number;
  count: number;
  templates: Template[];
}

interface LaneViewState {
  ledgerConfig: LedgerConfig;
  visibleSegments: VisibleSegment[];
  hiddenSlots: HiddenChildrenSlot[];
  selectedTemplateId: string | null;
  selectTemplate: (templateId: string | null) => void;
  selectedLaneTemplate: LaneTemplate | null;
}

/**
 * Compute visible segments (>= 1/20th of parent duration) and hidden slots.
 * Only processes direct children, no recursive rendering.
 */
function computeSegmentVisibility(
  segments: Segment[],
  parentDuration: number,
  allTemplates: Template[],
): { visible: VisibleSegment[]; hiddenSlots: HiddenChildrenSlot[] } {
  const visible: VisibleSegment[] = [];
  const hiddenBySlot: Map<number, Template[]> = new Map();

  const minDuration = parentDuration * MIN_VISIBILITY_RATIO;
  const slotDuration = parentDuration / TIME_SLOTS;

  for (const segment of segments) {
    const template = allTemplates.find((t) => t.id === segment.templateId);
    if (!template) continue;

    const duration = template.estimatedDuration;

    if (duration >= minDuration) {
      visible.push({
        templateId: segment.templateId,
        template,
        offset: segment.offset,
        duration,
      });
    } else {
      // Determine which slot this hidden segment falls into based on its offset
      const slotIndex = Math.min(
        Math.floor(segment.offset / slotDuration),
        TIME_SLOTS - 1,
      );
      const existing = hiddenBySlot.get(slotIndex) || [];
      existing.push(template);
      hiddenBySlot.set(slotIndex, existing);
    }
  }

  const hiddenSlots: HiddenChildrenSlot[] = [];
  hiddenBySlot.forEach((templates, slotIndex) => {
    hiddenSlots.push({
      slotIndex,
      count: templates.length,
      templates,
    });
  });

  // Sort hidden slots by index
  hiddenSlots.sort((a, b) => a.slotIndex - b.slotIndex);

  return { visible, hiddenSlots };
}

export function useLaneViewState(
  lane: LaneTemplate,
  allTemplates: Template[],
): LaneViewState {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  const selectTemplate = useCallback((templateId: string | null): void => {
    setSelectedTemplateId(templateId);
  }, []);

  const ledgerConfig = useMemo(
    (): LedgerConfig => calculateLedgerConfig(lane.estimatedDuration),
    [lane.estimatedDuration],
  );

  const { visible, hiddenSlots } = useMemo(
    () => computeSegmentVisibility(
      lane.segments,
      lane.estimatedDuration,
      allTemplates,
    ),
    [lane.segments, lane.estimatedDuration, allTemplates],
  );

  // Get the selected lane template if it's a lane and has smaller duration
  const selectedLaneTemplate = useMemo((): LaneTemplate | null => {
    if (!selectedTemplateId) return null;

    const template = allTemplates.find((t) => t.id === selectedTemplateId);
    if (!template) return null;
    if (template.templateType !== 'lane') return null;

    // Guard: child lane must have smaller duration than parent
    if (template.estimatedDuration >= lane.estimatedDuration) return null;

    return template as LaneTemplate;
  }, [selectedTemplateId, allTemplates, lane.estimatedDuration]);

  return {
    ledgerConfig,
    visibleSegments: visible,
    hiddenSlots,
    selectedTemplateId,
    selectTemplate,
    selectedLaneTemplate,
  };
}

export type { VisibleSegment, HiddenChildrenSlot, LaneViewState };
export { TIME_SLOTS };
