import React from 'react';

import type { LaneTemplate, Template } from '../../App';

import { formatDurationHuman } from './calculateLedgerConfig';
import { HiddenChildrenIndicator } from './HiddenChildrenIndicator';
import {
  useLaneViewState,
  TIME_SLOTS,
  type VisibleSegment,
  type HiddenChildrenSlot,
} from './useLaneViewState';

interface SharedLaneViewProps {
  lane: LaneTemplate;
  allTemplates: Template[];
}

const LANE_HEIGHT = 40;
const SEGMENT_HEIGHT = 32;
const LEDGER_HEIGHT = 24;
const HIDDEN_INDICATOR_HEIGHT = 24;

/**
 * Render the time ledger at the bottom of a lane view.
 */
function renderLedger(
  marks: Array<{ position: number; label: string }>,
): React.ReactElement {
  return (
    <div style={styles.ledger}>
      <div style={styles.ledgerLine} />
      {marks.map((mark, index) => (
        <div
          key={index}
          style={{
            ...styles.ledgerMark,
            left: `${mark.position * 100}%`,
          }}
        >
          <div style={styles.ledgerTick} />
          <span style={styles.ledgerLabel}>{mark.label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Render a single visible segment as a block.
 */
function renderSegmentBlock(
  segment: VisibleSegment,
  index: number,
  parentDuration: number,
  isSelected: boolean,
  onSelect: () => void,
): React.ReactElement {
  const leftPercent = (segment.offset / parentDuration) * 100;
  const widthPercent = (segment.duration / parentDuration) * 100;
  const isBusy = segment.template.templateType === 'busy';

  return (
    <div
      key={`${segment.templateId}-${index}`}
      className={`segment-block${isSelected ? ' selected' : ''}`}
      style={{
        ...styles.segmentBlock,
        ...(isBusy ? styles.busyBlock : styles.laneBlock),
        ...(isSelected ? styles.selectedBlock : {}),
        left: `${leftPercent}%`,
        width: `${Math.max(widthPercent, 2)}%`,
      }}
      onClick={(e): void => {
        e.stopPropagation();
        onSelect();
      }}
      title={`${segment.template.intent} (${formatDurationHuman(segment.duration)})`}
    />
  );
}

/**
 * Render hidden children indicators for a lane.
 */
function renderHiddenIndicators(
  hiddenSlots: HiddenChildrenSlot[],
): React.ReactElement[] {
  const slotWidthPercent = 100 / TIME_SLOTS;

  return hiddenSlots.map((slot) => {
    const leftPercent = slot.slotIndex * slotWidthPercent;
    return (
      <HiddenChildrenIndicator
        key={`hidden-${slot.slotIndex}`}
        count={slot.count}
        leftPercent={leftPercent}
        widthPercent={slotWidthPercent}
      />
    );
  });
}

interface SingleLaneLayerProps {
  lane: LaneTemplate;
  allTemplates: Template[];
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string | null) => void;
  showLabel: boolean;
}

/**
 * Render a single lane layer with its segments and hidden indicators.
 */
function SingleLaneLayer(
  props: SingleLaneLayerProps,
): React.ReactElement {
  const {
    lane,
    allTemplates,
    selectedTemplateId,
    onSelectTemplate,
    showLabel,
  } = props;

  const {
    ledgerConfig,
    visibleSegments,
    hiddenSlots,
  } = useLaneViewState(lane, allTemplates);

  const hasHiddenChildren = hiddenSlots.length > 0;
  const totalHeight = LANE_HEIGHT + SEGMENT_HEIGHT + LEDGER_HEIGHT
    + (hasHiddenChildren ? HIDDEN_INDICATOR_HEIGHT : 0);

  return (
    <div style={{ ...styles.layerContainer, height: totalHeight }}>
      {/* Lane label at top if enabled */}
      {showLabel && (
        <div style={styles.laneLabel}>
          <span style={styles.laneLabelText}>{lane.intent}</span>
          <span style={styles.laneLabelDuration}>
            {formatDurationHuman(lane.estimatedDuration)}
          </span>
        </div>
      )}

      {/* Main lane visualization area */}
      <div
        style={styles.laneArea}
        onClick={(): void => onSelectTemplate(null)}
      >
        <style>
          {`
            .segment-block:hover {
              box-shadow: inset 0 0 0 2px #666 !important;
            }
            .segment-block.selected:hover {
              box-shadow: inset 0 0 0 3px #333 !important;
            }
          `}
        </style>

        {/* Lane base block */}
        <div style={styles.laneBase} />

        {/* Segment blocks */}
        <div style={styles.segmentsContainer}>
          {visibleSegments.map((segment, index) => {
            const isSelected = selectedTemplateId === segment.templateId;
            return renderSegmentBlock(
              segment,
              index,
              lane.estimatedDuration,
              isSelected,
              (): void => {
                if (isSelected) {
                  onSelectTemplate(null);
                } else {
                  onSelectTemplate(segment.templateId);
                }
              },
            );
          })}
        </div>

        {/* Hidden children indicators */}
        {hasHiddenChildren && (
          <div style={styles.hiddenIndicatorsRow}>
            {renderHiddenIndicators(hiddenSlots)}
          </div>
        )}

        {/* Time ledger */}
        {renderLedger(ledgerConfig.marks)}
      </div>
    </div>
  );
}

/**
 * SharedLaneView - Renders a lane with single-layer segment visualization.
 *
 * Architecture:
 * - Only renders direct children that are >= 1/20th of parent duration
 * - Hidden children shown as circle indicators with +## count in time slots
 * - Selected lane templates open as a new LaneView stacked above
 * - Guards prevent rendering child lanes with >= parent duration
 */
export function SharedLaneView(
  { lane, allTemplates }: SharedLaneViewProps,
): React.ReactElement {
  const {
    selectedTemplateId,
    selectTemplate,
    selectedLaneTemplate,
  } = useLaneViewState(lane, allTemplates);

  return (
    <div style={styles.wrapper}>
      {/* Stacked child LaneView (if a lane segment is selected) */}
      {selectedLaneTemplate && (
        <div style={styles.stackedLayer}>
          <SharedLaneView
            lane={selectedLaneTemplate}
            allTemplates={allTemplates}
          />
        </div>
      )}

      {/* Current lane layer */}
      <SingleLaneLayer
        lane={lane}
        allTemplates={allTemplates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={selectTemplate}
        showLabel={true}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  stackedLayer: {
    borderLeft: '3px solid #1565c0',
    paddingLeft: 12,
    marginLeft: 4,
  },
  layerContainer: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fafafa',
    borderRadius: 8,
    overflow: 'hidden',
  },
  laneLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: '#e3f2fd',
    borderBottom: '1px solid #90caf9',
  },
  laneLabelText: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1565c0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  laneLabelDuration: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: 500,
    flexShrink: 0,
    marginLeft: 12,
  },
  laneArea: {
    position: 'relative',
    flex: 1,
    padding: '8px 0',
    minHeight: LANE_HEIGHT + SEGMENT_HEIGHT + LEDGER_HEIGHT,
  },
  laneBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: LEDGER_HEIGHT,
    height: LANE_HEIGHT - 4,
    backgroundColor: '#e3f2fd',
    border: '1px solid #90caf9',
    borderRadius: 8,
  },
  segmentsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: LEDGER_HEIGHT + LANE_HEIGHT,
    height: SEGMENT_HEIGHT,
  },
  segmentBlock: {
    position: 'absolute',
    top: 0,
    height: SEGMENT_HEIGHT - 4,
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'box-shadow 0.15s ease',
    boxSizing: 'border-box',
  },
  laneBlock: {
    backgroundColor: '#bbdefb',
    border: '2px solid #64b5f6',
  },
  busyBlock: {
    backgroundColor: '#ffe0b2',
    border: '2px solid #ffb74d',
  },
  selectedBlock: {
    boxShadow: 'inset 0 0 0 2px #333',
  },
  hiddenIndicatorsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: LEDGER_HEIGHT + LANE_HEIGHT + SEGMENT_HEIGHT,
    height: HIDDEN_INDICATOR_HEIGHT,
  },
  ledger: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: LEDGER_HEIGHT,
    paddingTop: 4,
  },
  ledgerLine: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#bdbdbd',
  },
  ledgerMark: {
    position: 'absolute',
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transform: 'translateX(-50%)',
  },
  ledgerTick: {
    width: 1,
    height: 8,
    backgroundColor: '#757575',
  },
  ledgerLabel: {
    fontSize: 10,
    color: '#616161',
    marginTop: 2,
    whiteSpace: 'nowrap',
  },
};
