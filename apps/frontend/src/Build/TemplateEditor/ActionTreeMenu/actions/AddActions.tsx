import type { LaneTemplate } from '@tannerbroberts/about-time-core';
import { AnimatePresence } from 'framer-motion';
import React from 'react';

import { useBuildStore } from '../../../store';
import { calculateEmptyRegions } from '../../../utils/emptyRegions';
import { ActionLeaf } from '../ActionLeaf';
import { ConnectionLine } from '../ConnectionLine';
import { MenuNode } from '../MenuNode';
import type { Position } from '../types';
import { calculateNodePosition, distributeAngles } from '../utils/positioning';

export interface AddActionsProps {
  currentPath: string[];
  onNavigate: (path: string[]) => void;
  parentPosition: Position;
  parentAngle: number;
  color: string;
}

export function AddActions({ currentPath, onNavigate, parentPosition, parentAngle, color }: AddActionsProps): React.ReactElement {
  const focusedLineage = useBuildStore((state) => state.focusedLineage);
  const templates = useBuildStore((state) => state.templates);
  const openSegmentAddModal = useBuildStore((state) => state.openSegmentAddModal);
  const openTemplateForm = useBuildStore((state) => state.openTemplateForm);

  const isAtCreateNew = currentPath.length === 3 && currentPath[2] === 'create-new';

  // Calculate the largest available gap
  const getLargestGap = (): { start: number; end: number } | null => {
    if (focusedLineage.length === 0) {
      return null;
    }

    const focusedItem = focusedLineage[focusedLineage.length - 1];
    const template = templates[focusedItem.templateId];

    if (!template || template.templateType !== 'lane') {
      return null;
    }

    const laneTemplate = template as LaneTemplate;
    const emptyRegions = calculateEmptyRegions(
      laneTemplate.segments,
      laneTemplate.estimatedDuration,
      templates,
    );

    if (emptyRegions.length === 0) {
      return null;
    }

    // Find the largest gap
    return emptyRegions.reduce((largest, region) => {
      const regionSize = region.end - region.start;
      const largestSize = largest.end - largest.start;
      return regionSize > largestSize ? region : largest;
    });
  };

  const handleSelectExisting = (): void => {
    const largestGap = getLargestGap();
    if (largestGap) {
      openSegmentAddModal(largestGap);
    }
  };

  const handleCreateBusy = (): void => {
    openTemplateForm(undefined, 'busy');
  };

  const handleCreateLane = (): void => {
    openTemplateForm(undefined, 'lane');
  };

  // Calculate positions for first level children
  const angles = distributeAngles(2, parentAngle);
  const positions = angles.map((angle) => calculateNodePosition(angle, 140, parentPosition.x, parentPosition.y));

  // "Select Existing" position
  const selectExistingPosition = positions[0];
  // "Create New" position
  const createNewPosition = positions[1];

  // If at create-new level, calculate positions for Create New's children
  let createBusyPosition: Position | null = null;
  let createLanePosition: Position | null = null;

  if (isAtCreateNew) {
    const subAngles = distributeAngles(2, parentAngle);
    const subPositions = subAngles.map((angle) => calculateNodePosition(angle, 140, createNewPosition.x, createNewPosition.y));
    createBusyPosition = subPositions[0];
    createLanePosition = subPositions[1];
  }

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
          <ConnectionLine key="line-select-existing" from={parentPosition} to={selectExistingPosition} color={color} animate />
          <ConnectionLine key="line-create-new" from={parentPosition} to={createNewPosition} color={color} animate />
          {isAtCreateNew && createBusyPosition && createLanePosition && (
            <>
              <ConnectionLine key="line-create-busy" from={createNewPosition} to={createBusyPosition} color={color} animate />
              <ConnectionLine key="line-create-lane" from={createNewPosition} to={createLanePosition} color={color} animate />
            </>
          )}
        </AnimatePresence>
      </svg>

      {/* HTML nodes */}
      <AnimatePresence>
        <ActionLeaf
          key="leaf-select-existing"
          label="Select Existing"
          onClick={handleSelectExisting}
          position={selectExistingPosition}
          color={color}
        />
        <MenuNode
          key="node-create-new"
          label="Create New"
          onClick={(): void => onNavigate([...currentPath, 'create-new'])}
          position={createNewPosition}
          size={60}
          color={color}
          isExpanded={isAtCreateNew}
        />
        {isAtCreateNew && createBusyPosition && createLanePosition && (
          <>
            <ActionLeaf
              key="leaf-create-busy"
              label="Create Busy"
              onClick={handleCreateBusy}
              position={createBusyPosition}
              color={color}
            />
            <ActionLeaf
              key="leaf-create-lane"
              label="Create Lane"
              onClick={handleCreateLane}
              position={createLanePosition}
              color={color}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
