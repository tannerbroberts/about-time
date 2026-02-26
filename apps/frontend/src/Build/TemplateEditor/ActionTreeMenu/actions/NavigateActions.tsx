import { AnimatePresence } from 'framer-motion';
import React from 'react';

import { useBuildStore } from '../../../store';
import { ActionLeaf } from '../ActionLeaf';
import { ConnectionLine } from '../ConnectionLine';
import type { Position } from '../types';
import type { ActionAvailability } from '../useContextActions';
import { calculateNodePosition, distributeAngles } from '../utils/positioning';

export interface NavigateActionsProps {
  availability: ActionAvailability;
  parentPosition: Position;
  parentAngle: number;
  color: string;
}

export function NavigateActions({ availability, parentPosition, parentAngle, color }: NavigateActionsProps): React.ReactElement {
  const focusedLineage = useBuildStore((state) => state.focusedLineage);
  const setFocusedLineage = useBuildStore((state) => state.setFocusedLineage);
  const openBaseTemplateSelection = useBuildStore((state) => state.openBaseTemplateSelection);

  const handleFocusParent = (): void => {
    if (focusedLineage.length > 1) {
      setFocusedLineage(focusedLineage.slice(0, -1));
    }
  };

  const handleChangeBaseTemplate = (): void => {
    openBaseTemplateSelection();
  };

  const children = ['Focus Parent', 'Change Base'];
  const angles = distributeAngles(children.length, parentAngle);
  const positions = angles.map((angle) => calculateNodePosition(angle, 140, parentPosition.x, parentPosition.y));

  return (
    <>
      {/* SVG layer for connection lines */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <AnimatePresence>
          <ConnectionLine key="line-focus-parent" from={parentPosition} to={positions[0]} color={color} animate />
          <ConnectionLine key="line-change-base" from={parentPosition} to={positions[1]} color={color} animate />
        </AnimatePresence>
      </svg>

      {/* HTML nodes */}
      <AnimatePresence>
        <ActionLeaf
          key="leaf-focus-parent"
          label="Focus Parent"
          onClick={handleFocusParent}
          disabled={!availability.canFocusParent}
          disabledTooltip={availability.focusParentDisabledReason}
          position={positions[0]}
          color={color}
        />
        <ActionLeaf
          key="leaf-change-base"
          label="Change Base"
          onClick={handleChangeBaseTemplate}
          disabled={!availability.canChangeBaseTemplate}
          position={positions[1]}
          color={color}
        />
      </AnimatePresence>
    </>
  );
}
