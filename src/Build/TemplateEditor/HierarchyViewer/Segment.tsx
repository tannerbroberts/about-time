import Chip from '@mui/material/Chip';
import { Box } from '@mui/system';
import type { Template } from '@tannerbroberts/about-time-core';
import React from 'react';

import type { FocusPathItem } from '../../store';
import { useBuildStore } from '../../store';
import { generateLineageKey } from '../../utils/lineageKeys';
import { calculateSegmentPosition, calculateSegmentWidth, countNestedLevels } from '../../utils/positioning';

export interface SegmentProps {
  templateId: string;
  offset: number;
  depth: number;
  lineage: FocusPathItem[];
  baseDuration: number;
  cumulativeOffset: number;
}

const SegmentComponent: React.FC<SegmentProps> = ({
  templateId,
  offset: _offset,
  depth,
  lineage,
  baseDuration,
  cumulativeOffset,
}) => {
  const template = useBuildStore((state) => state.templates[templateId]) as Template | undefined;
  const maxDepth = useBuildStore((state) => state.maxDepth);
  const focusedLineage = useBuildStore((state) => state.focusedLineage);
  const setFocusedLineage = useBuildStore((state) => state.setFocusedLineage);
  const openActionMenu = useBuildStore((state) => state.openActionMenu);
  const templates = useBuildStore((state) => state.templates);

  // Ref to get the segment's DOM element for positioning (must be before any conditionals)
  const segmentRef = React.useRef<HTMLDivElement>(null);

  if (!template) {
    return null;
  }

  const currentLineageKey = generateLineageKey(lineage);
  const focusedLineageKey = generateLineageKey(focusedLineage);
  const isFocused = currentLineageKey === focusedLineageKey;

  const leftPercent = calculateSegmentPosition(cumulativeOffset, baseDuration);
  const widthPercent = calculateSegmentWidth(template.estimatedDuration, baseDuration);

  const handleClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setFocusedLineage(lineage);

    // Open action menu near the segment
    if (segmentRef.current) {
      const rect = segmentRef.current.getBoundingClientRect();
      // Position menu to the right of the segment, centered vertically
      openActionMenu({
        x: rect.right + 20,
        y: rect.top + rect.height / 2,
      });
    }
  };

  const handleContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    // Focus this segment first if not already focused
    if (!isFocused) {
      setFocusedLineage(lineage);
    }
    // Open action menu at cursor position
    openActionMenu({ x: e.clientX, y: e.clientY });
  };

  // Check if we should render child segments
  const shouldRenderChildren = depth < maxDepth;
  const segments = template.templateType === 'lane' ? template.segments : [];

  // Calculate hidden levels if depth is clamped
  let hiddenLevels = 0;
  if (!shouldRenderChildren && segments.length > 0) {
    hiddenLevels = countNestedLevels(templateId, templates);
  }

  return (
    <>
      <Box
        ref={segmentRef}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        sx={{
          position: 'absolute',
          left: `${leftPercent}%`,
          width: `${widthPercent}%`,
          bottom: `${depth * 60}px`,
          height: '50px',
          backgroundColor: isFocused ? 'primary.main' : 'grey.300',
          border: isFocused ? '3px solid' : '1px solid',
          borderColor: isFocused ? 'primary.dark' : 'grey.400',
          borderRadius: 1,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          transition: 'all 0.2s',
          '&:hover': {
            backgroundColor: isFocused ? 'primary.dark' : 'grey.400',
            transform: 'translateY(-2px)',
            boxShadow: 2,
          },
        }}
      >
        <Box
          sx={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: isFocused ? 'primary.contrastText' : 'text.primary',
            textAlign: 'center',
            padding: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {template.intent || template.id}
        </Box>

        {hiddenLevels > 0 && (
          <Chip
            label={`+${hiddenLevels} levels`}
            size="small"
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              height: '20px',
              fontSize: '0.7rem',
            }}
          />
        )}
      </Box>

      {shouldRenderChildren
        && segments.map((segment) => (
          <Segment
            key={generateLineageKey([...lineage, { templateId: segment.templateId, offset: segment.offset }])}
            templateId={segment.templateId}
            offset={segment.offset}
            depth={depth + 1}
            lineage={[...lineage, { templateId: segment.templateId, offset: segment.offset }]}
            baseDuration={baseDuration}
            cumulativeOffset={cumulativeOffset + segment.offset}
          />
        ))}
    </>
  );
};

export const Segment = React.memo(SegmentComponent);
