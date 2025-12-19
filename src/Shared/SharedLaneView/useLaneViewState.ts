import { useMemo, useState, useCallback } from 'react';

import type { Template, LaneTemplate, Segment } from '../../App';

import { calculateLedgerConfig, type LedgerConfig } from './calculateLedgerConfig';

interface ResolvedSegment {
  template: Template;
  offset: number;
  depth: number;
}

interface CollapsedGroup {
  type: 'collapsed';
  count: number;
  offset: number;
  depth: number;
  templates: Template[];
  endOffset: number;
  precedingTemplate: Template | null;
}

interface VisibleSegment {
  type: 'visible';
  template: Template;
  offset: number;
  depth: number;
}

type DisplaySegment = VisibleSegment | CollapsedGroup;

interface LaneViewState {
  ledgerConfig: LedgerConfig;
  resolvedSegments: ResolvedSegment[];
  displaySegments: DisplaySegment[];
  maxDepth: number;
  hoveredTooltip: string | null;
  setHoveredTooltip: (tooltip: string | null) => void;
  selectedTemplate: Template | null;
  selectTemplate: (template: Template | null) => void;
  expandedGroupIndex: number | null;
  toggleExpandedGroup: (index: number) => void;
  hoveredGroupIndex: number | null;
  setHoveredGroupIndex: (index: number | null) => void;
}

interface TruncateResult {
  text: string;
  isTruncated: boolean;
}

/**
 * Recursively resolve segments and calculate their depth
 */
function resolveSegmentsRecursively(
  segments: Segment[],
  allTemplates: Template[],
  parentOffset: number,
  currentDepth: number,
): ResolvedSegment[] {
  const result: ResolvedSegment[] = [];

  for (const segment of segments) {
    const template = allTemplates.find((t) => t.id === segment.templateId);
    if (!template) continue;

    const absoluteOffset = parentOffset + segment.offset;

    result.push({
      template,
      offset: absoluteOffset,
      depth: currentDepth,
    });

    // If this is a lane, recursively resolve its segments at a higher depth
    if (template.templateType === 'lane') {
      const nestedSegments = resolveSegmentsRecursively(
        (template as LaneTemplate).segments,
        allTemplates,
        absoluteOffset,
        currentDepth + 1,
      );
      result.push(...nestedSegments);
    }
  }

  return result;
}

/**
 * Truncate text with ellipsis if longer than maxLength
 */
function truncateTextInternal(text: string, maxLength: number): TruncateResult {
  if (text.length <= maxLength) {
    return { text, isTruncated: false };
  }
  return { text: `${text.slice(0, maxLength - 3)}...`, isTruncated: true };
}

/**
 * Format variables for display
 */
function formatVariablesInternal(template: Template): string {
  if (template.templateType === 'busy') {
    const consumes = Object.entries(template.willConsume)
      .map(([name, qty]) => `-${qty} ${name}`)
      .join(', ');
    const produces = Object.entries(template.willProduce)
      .map(([name, qty]) => `+${qty} ${name}`)
      .join(', ');
    const parts = [consumes, produces].filter(Boolean);
    return parts.join(' | ');
  }
  return '';
}

/**
 * Minimum width percentage for a segment to be rendered as a full capsule.
 * Segments smaller than this will be collapsed into a "+n" indicator.
 * 5% ensures the capsule is at least as wide as it is tall (sphere-like minimum).
 */
const MIN_CAPSULE_WIDTH_PERCENT = 5;

/**
 * Group resolved segments into displayable segments, collapsing small ones.
 * Consecutive small segments at the same depth are grouped together.
 */
function computeDisplaySegments(
  resolvedSegments: ResolvedSegment[],
  totalDuration: number,
): DisplaySegment[] {
  const result: DisplaySegment[] = [];
  let i = 0;

  while (i < resolvedSegments.length) {
    const segment = resolvedSegments[i];
    const widthPercent = (segment.template.estimatedDuration / totalDuration) * 100;

    if (widthPercent >= MIN_CAPSULE_WIDTH_PERCENT) {
      // Large enough to render as a full capsule
      result.push({
        type: 'visible',
        template: segment.template,
        offset: segment.offset,
        depth: segment.depth,
      });
      i++;
    } else {
      // Small segment - start collecting consecutive small segments at same depth
      const smallSegments: ResolvedSegment[] = [segment];
      const depth = segment.depth;
      let j = i + 1;

      while (j < resolvedSegments.length) {
        const nextSegment = resolvedSegments[j];
        if (nextSegment.depth !== depth) break;

        const nextDuration = nextSegment.template.estimatedDuration;
        const nextWidthPercent = (nextDuration / totalDuration) * 100;
        if (nextWidthPercent >= MIN_CAPSULE_WIDTH_PERCENT) break;

        smallSegments.push(nextSegment);
        j++;
      }

      // Find the preceding template at this depth (could be visible or from prior group)
      let precedingTemplate: Template | null = null;
      for (let k = result.length - 1; k >= 0; k--) {
        const prev = result[k];
        if (prev.type === 'visible' && prev.depth === depth) {
          precedingTemplate = prev.template;
          break;
        } else if (prev.type === 'collapsed' && prev.depth === depth) {
          // Use the last template from the collapsed group
          precedingTemplate = prev.templates[prev.templates.length - 1];
          break;
        }
      }

      // Calculate end offset (start of first small + sum of all small durations)
      const lastSmall = smallSegments[smallSegments.length - 1];
      const endOffset = lastSmall.offset + lastSmall.template.estimatedDuration;

      result.push({
        type: 'collapsed',
        count: smallSegments.length,
        offset: smallSegments[0].offset,
        depth,
        templates: smallSegments.map((s) => s.template),
        endOffset,
        precedingTemplate,
      });

      i = j;
    }
  }

  return result;
}

export function useLaneViewState(
  lane: LaneTemplate,
  allTemplates: Template[],
): LaneViewState {
  const [hoveredTooltip, setHoveredTooltipState] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [expandedGroupIndex, setExpandedGroupIndex] = useState<number | null>(null);
  const [hoveredGroupIndex, setHoveredGroupIndexState] = useState<number | null>(
    null,
  );

  const setHoveredTooltip = useCallback((tooltip: string | null): void => {
    setHoveredTooltipState(tooltip);
  }, []);

  const selectTemplate = useCallback((template: Template | null): void => {
    setSelectedTemplate(template);
  }, []);

  const toggleExpandedGroup = useCallback((index: number): void => {
    setExpandedGroupIndex((prev) => (prev === index ? null : index));
  }, []);

  const setHoveredGroupIndex = useCallback((index: number | null): void => {
    setHoveredGroupIndexState(index);
  }, []);

  const ledgerConfig = useMemo(
    (): LedgerConfig => calculateLedgerConfig(lane.estimatedDuration),
    [lane.estimatedDuration],
  );

  const resolvedSegments = useMemo((): ResolvedSegment[] => {
    return resolveSegmentsRecursively(lane.segments, allTemplates, 0, 1);
  }, [lane.segments, allTemplates]);

  const displaySegments = useMemo(
    (): DisplaySegment[] => computeDisplaySegments(
      resolvedSegments,
      lane.estimatedDuration,
    ),
    [resolvedSegments, lane.estimatedDuration],
  );

  const maxDepth = useMemo((): number => {
    if (resolvedSegments.length === 0) return 0;
    return Math.max(...resolvedSegments.map((s) => s.depth));
  }, [resolvedSegments]);

  return {
    ledgerConfig,
    resolvedSegments,
    displaySegments,
    maxDepth,
    hoveredTooltip,
    setHoveredTooltip,
    selectedTemplate,
    selectTemplate,
    expandedGroupIndex,
    toggleExpandedGroup,
    hoveredGroupIndex,
    setHoveredGroupIndex,
  };
}

export const truncateText = truncateTextInternal;
export const formatVariables = formatVariablesInternal;
export type { DisplaySegment, CollapsedGroup, VisibleSegment };
