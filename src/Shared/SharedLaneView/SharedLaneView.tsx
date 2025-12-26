import React from 'react';

import type { LaneTemplate, Template, BusyTemplate } from '../../App';
import type { ValidationError, ValidationResult } from '../../validation/validateLane';

import { formatDurationHuman } from './calculateLedgerConfig';
import { useLaneValidation } from './useLaneValidation';
import {
  useLaneViewState,
  truncateText,
  formatVariables,
  type CollapsedGroup,
  type VisibleSegment,
} from './useLaneViewState';

interface SharedLaneViewProps {
  lane: LaneTemplate;
  allTemplates: Template[];
}

const CAPSULE_HEIGHT = 32;
const LEDGER_HEIGHT = 24;
const MAX_TEXT_LENGTH = 80;
const POPOVER_ITEM_HEIGHT = 24;

interface CollapsedGroupRenderProps {
  group: CollapsedGroup;
  index: number;
  totalDuration: number;
  isExpanded: boolean;
  isHovered: boolean;
  onToggleExpand: () => void;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
}

/**
 * Render a single item in the hover popover list.
 */
function renderPopoverItem(
  template: Template,
  itemIndex: number,
): React.ReactElement {
  const isBusy = template.templateType === 'busy';
  return (
    <div
      key={`${template.id}-${itemIndex}`}
      style={{
        ...styles.popoverItem,
        ...(isBusy ? styles.popoverItemBusy : styles.popoverItemLane),
      }}
    >
      <span style={styles.popoverItemDot}>
        {isBusy ? '●' : '○'}
      </span>
      <span style={styles.popoverItemText}>{template.intent}</span>
      <span style={styles.popoverItemDuration}>
        {formatDurationHuman(template.estimatedDuration)}
      </span>
    </div>
  );
}

/**
 * Render a collapsed group as an expandable accordion with hover popover.
 * - Hover shows a popover with all collapsed templates
 * - Click expands inline to show mini-capsules
 */
function renderCollapsedGroup(
  props: CollapsedGroupRenderProps,
): React.ReactElement {
  const {
    group,
    index,
    totalDuration,
    isExpanded,
    isHovered,
    onToggleExpand,
    onHoverEnter,
    onHoverLeave,
  } = props;

  const leftPercent = (group.offset / totalDuration) * 100;
  const widthPercent = ((group.endOffset - group.offset) / totalDuration) * 100;
  const bottomOffset = LEDGER_HEIGHT + group.depth * CAPSULE_HEIGHT;

  // Determine style based on template types in the group
  const busyCount = group.templates.filter(
    (t) => t.templateType === 'busy',
  ).length;
  const laneCount = group.templates.length - busyCount;
  const isMostlyBusy = busyCount >= laneCount;

  // Calculate popover height
  const popoverHeight = Math.min(group.templates.length, 5) * POPOVER_ITEM_HEIGHT
    + 16;

  return (
    <div
      key={`collapsed-${index}`}
      style={{
        ...styles.collapsedGroup,
        ...(isMostlyBusy ? styles.collapsedBusy : styles.collapsedLane),
        bottom: bottomOffset,
        left: `${leftPercent}%`,
        width: `${Math.max(widthPercent, 4)}%`,
      }}
      onClick={onToggleExpand}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
    >
      {/* Accordion strip with chevron and count */}
      <div style={styles.accordionStrip}>
        <span style={styles.accordionChevron}>
          {isExpanded ? '▾' : '▸'}
        </span>
        <span style={styles.accordionCount}>{group.count}</span>
        {busyCount > 0 && laneCount > 0 && (
          <span style={styles.accordionMix}>
            <span style={styles.mixBusy}>●{busyCount}</span>
            <span style={styles.mixLane}>○{laneCount}</span>
          </span>
        )}
      </div>

      {/* Hover popover showing all templates */}
      {isHovered && !isExpanded && (
        <div
          style={{
            ...styles.groupPopover,
            height: popoverHeight,
          }}
        >
          <div style={styles.popoverHeader}>
            {group.count} collapsed items
          </div>
          <div style={styles.popoverList}>
            {group.templates.slice(0, 5).map((t, i) => renderPopoverItem(t, i))}
            {group.templates.length > 5 && (
              <div style={styles.popoverMore}>
                +{group.templates.length - 5} more...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded inline mini-capsules */}
      {isExpanded && (
        <div style={styles.expandedContainer}>
          {group.templates.map((template, i) => {
            const isBusy = template.templateType === 'busy';
            return (
              <div
                key={`${template.id}-${i}`}
                style={{
                  ...styles.miniCapsule,
                  ...(isBusy ? styles.miniBusy : styles.miniLane),
                }}
                title={`${template.intent} (${formatDurationHuman(template.estimatedDuration)})`}
              >
                <span style={styles.miniText}>
                  {template.intent.slice(0, 12)}
                  {template.intent.length > 12 ? '…' : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Render a visible segment capsule with hover effect and selection capability.
 */
function renderVisibleSegment(
  segment: VisibleSegment,
  index: number,
  totalDuration: number,
  setHoveredTooltip: (tooltip: string | null) => void,
  selectedTemplate: Template | null,
  selectTemplate: (template: Template | null) => void,
): React.ReactElement {
  const leftPercent = (segment.offset / totalDuration) * 100;
  const estDuration = segment.template.estimatedDuration;
  const durationRatio = estDuration / totalDuration;
  const widthPercent = durationRatio * 100;
  const bottomOffset = LEDGER_HEIGHT + segment.depth * CAPSULE_HEIGHT;

  const isBusy = segment.template.templateType === 'busy';
  const variables = formatVariables(segment.template);
  const segmentText = variables
    ? `${segment.template.intent} | ${variables}`
    : segment.template.intent;
  const truncateResult = truncateText(segmentText, MAX_TEXT_LENGTH);
  const displayText = truncateResult.text;
  const isTruncated = truncateResult.isTruncated;
  const isSelected = selectedTemplate?.id === segment.template.id;
  const className = `lane-capsule${isSelected ? ' selected' : ''}`;

  return (
    <div
      key={`${segment.template.id}-${index}`}
      className={className}
      style={{
        ...styles.capsule,
        ...(isBusy ? styles.busyCapsule : styles.laneCapsule),
        ...(isSelected ? styles.selectedCapsule : {}),
        bottom: bottomOffset,
        left: `${leftPercent}%`,
        width: `${Math.max(widthPercent, 2)}%`,
      }}
      onClick={(e): void => {
        e.stopPropagation();
        selectTemplate(isSelected ? null : segment.template);
      }}
      onMouseEnter={(): void => {
        if (isTruncated) setHoveredTooltip(segmentText);
      }}
      onMouseLeave={(): void => setHoveredTooltip(null)}
      title={isTruncated ? segmentText : undefined}
    >
      <span style={styles.capsuleContent}>
        {displayText}
      </span>
    </div>
  );
}

/**
 * Render the details panel for the selected template.
 */
function renderDetailsPanel(template: Template): React.ReactElement {
  const isBusy = template.templateType === 'busy';

  return (
    <div style={styles.detailsPanel}>
      <div style={styles.detailsHeader}>
        <span style={styles.detailsType}>{isBusy ? 'Task' : 'Lane'}</span>
        <span style={styles.detailsId}>{template.id}</span>
      </div>
      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>Intent:</span>
        <span style={styles.detailsValue}>{template.intent}</span>
      </div>
      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>Duration:</span>
        <span style={styles.detailsValue}>
          {formatDurationHuman(template.estimatedDuration)}
        </span>
      </div>
      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>Author:</span>
        <span style={styles.detailsValue}>{template.authorId}</span>
      </div>
      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>Version:</span>
        <span style={styles.detailsValue}>{template.version}</span>
      </div>
      {isBusy && (
        <>
          <div style={styles.detailsRow}>
            <span style={styles.detailsLabel}>Consumes:</span>
            <span style={styles.detailsValue}>
              {formatLedger((template as BusyTemplate).willConsume)}
            </span>
          </div>
          <div style={styles.detailsRow}>
            <span style={styles.detailsLabel}>Produces:</span>
            <span style={styles.detailsValue}>
              {formatLedger((template as BusyTemplate).willProduce)}
            </span>
          </div>
        </>
      )}
      {!isBusy && (
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Segments:</span>
          <span style={styles.detailsValue}>
            {(template as LaneTemplate).segments.length}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Format a state ledger for display.
 */
function formatLedger(ledger: Record<string, number>): string {
  const entries = Object.entries(ledger);
  if (entries.length === 0) return 'None';
  return entries.map(([name, qty]) => `${qty} ${name}`).join(', ');
}

/**
 * Get icon for validation error type.
 */
function getErrorIcon(errorType: ValidationError['type']): string {
  switch (errorType) {
    case 'busy-overlap':
      return '⏱️';
    case 'unsatisfied-consume':
      return '📥';
    case 'unsatisfied-produce':
      return '📤';
    case 'missing-template':
      return '❓';
    case 'empty-lane':
      return '🚫';
    default:
      return '⚠️';
  }
}

/**
 * Get human-readable label for error type.
 */
function getErrorTypeLabel(errorType: ValidationError['type']): string {
  switch (errorType) {
    case 'busy-overlap':
      return 'Overlap';
    case 'unsatisfied-consume':
      return 'Missing Input';
    case 'unsatisfied-produce':
      return 'Orphan Output';
    case 'missing-template':
      return 'Missing Template';
    case 'empty-lane':
      return 'Empty Lane';
    default:
      return 'Error';
  }
}

/**
 * Render the validation panel showing errors and contract signature.
 */
function renderValidationPanel(validation: ValidationResult): React.ReactElement {
  const hasErrors = validation.errors.length > 0;
  const hasInputs = Object.keys(validation.contractInputs).length > 0;
  const hasOutputs = Object.keys(validation.contractOutputs).length > 0;

  return (
    <div style={styles.validationPanel}>
      {/* Contract Signature */}
      <div style={styles.contractSection}>
        <div style={styles.contractHeader}>
          <span style={styles.contractTitle}>Contract Signature</span>
          <span style={hasErrors ? styles.contractInvalid : styles.contractValid}>
            {hasErrors ? '✗ Invalid' : '✓ Valid'}
          </span>
        </div>
        <div style={styles.contractBody}>
          <div style={styles.contractRow}>
            <span style={styles.contractLabel}>Inputs:</span>
            <span style={styles.contractValue}>
              {hasInputs ? formatLedger(validation.contractInputs) : '(none)'}
            </span>
          </div>
          <div style={styles.contractRow}>
            <span style={styles.contractLabel}>Outputs:</span>
            <span style={styles.contractValue}>
              {hasOutputs ? formatLedger(validation.contractOutputs) : '(none)'}
            </span>
          </div>
          {validation.firstBusy && (
            <div style={styles.contractRow}>
              <span style={styles.contractLabel}>First Task:</span>
              <span style={styles.contractValueMono}>
                {validation.firstBusy.intent}
              </span>
            </div>
          )}
          {validation.lastBusy && (
            <div style={styles.contractRow}>
              <span style={styles.contractLabel}>Last Task:</span>
              <span style={styles.contractValueMono}>
                {validation.lastBusy.intent}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Errors Section */}
      {hasErrors && (
        <div style={styles.errorsSection}>
          <div style={styles.errorsHeader}>
            <span style={styles.errorsIcon}>⚠️</span>
            <span style={styles.errorsTitle}>
              {validation.errors.length} Validation Error
              {validation.errors.length > 1 ? 's' : ''}
            </span>
          </div>
          <div style={styles.errorsList}>
            {validation.errors.map((error, index) => (
              <div key={index} style={styles.errorItem}>
                <span style={styles.errorIcon}>{getErrorIcon(error.type)}</span>
                <div style={styles.errorContent}>
                  <span style={styles.errorType}>
                    {getErrorTypeLabel(error.type)}
                  </span>
                  <span style={styles.errorMessage}>{error.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SharedLaneView - Renders a lane template as stacked capsules with a time ledger
 *
 * Architecture:
 * - Base lane renders at the bottom (depth 0)
 * - Each nested lane/busy template renders one layer up
 * - Time ledger shows along the bottom x-axis
 *
 * Time ledger rules:
 * - Interval is between 1/10 and 1/20 of the total duration
 * - Prefers smaller intervals when there's a tie
 * - Never shows months, uses weeks instead
 * - Available units: ms, s, min, h, d, w
 */
export function SharedLaneView(
  { lane, allTemplates }: SharedLaneViewProps,
): React.ReactElement {
  const {
    ledgerConfig,
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
  } = useLaneViewState(lane, allTemplates);

  const validation = useLaneValidation(lane, allTemplates);

  const totalHeight = (maxDepth + 1) * CAPSULE_HEIGHT + LEDGER_HEIGHT + 16;

  const laneText = `${lane.intent}`;
  const truncatedLane = truncateText(laneText, MAX_TEXT_LENGTH);
  const displayLaneText = truncatedLane.text;
  const laneIsTruncated = truncatedLane.isTruncated;
  const fullLaneTooltip = laneText;

  const isBaseLaneSelected = selectedTemplate?.id === lane.id;

  return (
    <div style={styles.wrapper} onClick={(): void => selectTemplate(null)}>
      <style>
        {`
          .lane-capsule:hover {
            box-shadow: inset 0 0 0 2px #666 !important;
          }
          .lane-capsule.selected:hover {
            box-shadow: inset 0 0 0 3px #333 !important;
          }
        `}
      </style>
      <div style={{ ...styles.container, height: totalHeight }}>
        {/* Capsule layers */}
        <div style={styles.capsuleContainer}>
          {/* Base lane capsule (depth 0) */}
          <div
            className={`lane-capsule${isBaseLaneSelected ? ' selected' : ''}`}
            style={{
              ...styles.capsule,
              ...styles.laneCapsule,
              ...(isBaseLaneSelected ? styles.selectedCapsule : {}),
              bottom: LEDGER_HEIGHT,
              left: 0,
              width: '100%',
            }}
            onClick={(e): void => {
              e.stopPropagation();
              selectTemplate(isBaseLaneSelected ? null : lane);
            }}
            onMouseEnter={(): void => {
              if (laneIsTruncated) setHoveredTooltip(fullLaneTooltip);
            }}
            onMouseLeave={(): void => setHoveredTooltip(null)}
            title={laneIsTruncated ? fullLaneTooltip : undefined}
          >
            <span style={styles.capsuleContent}>
              {displayLaneText}
              <span style={styles.durationBadge}>
                {formatDurationHuman(lane.estimatedDuration)}
              </span>
            </span>
          </div>

          {/* Nested segment capsules */}
          {displaySegments.map((segment, index) => {
            if (segment.type === 'collapsed') {
              return renderCollapsedGroup({
                group: segment,
                index,
                totalDuration: lane.estimatedDuration,
                isExpanded: expandedGroupIndex === index,
                isHovered: hoveredGroupIndex === index,
                onToggleExpand: (): void => toggleExpandedGroup(index),
                onHoverEnter: (): void => setHoveredGroupIndex(index),
                onHoverLeave: (): void => setHoveredGroupIndex(null),
              });
            }

            return renderVisibleSegment(
              segment,
              index,
              lane.estimatedDuration,
              setHoveredTooltip,
              selectedTemplate,
              selectTemplate,
            );
          })}
        </div>

        {/* Time ledger */}
        <div style={styles.ledger}>
          <div style={styles.ledgerLine} />
          {ledgerConfig.marks.map((mark, index) => (
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

        {/* Floating tooltip */}
        {hoveredTooltip && (
          <div style={styles.floatingTooltip}>
            {hoveredTooltip}
          </div>
        )}
      </div>

      {/* Validation panel */}
      {renderValidationPanel(validation)}

      {/* Details panel */}
      {selectedTemplate && renderDetailsPanel(selectedTemplate)}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  container: {
    position: 'relative',
    width: '100%',
    minHeight: 100,
    padding: '8px 0',
    backgroundColor: '#fafafa',
    borderRadius: 8,
    overflow: 'hidden',
  },
  capsuleContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  capsule: {
    position: 'absolute',
    height: CAPSULE_HEIGHT - 4,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    fontSize: 12,
    boxSizing: 'border-box',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s ease, opacity 0.15s ease',
  },
  laneCapsule: {
    backgroundColor: '#e3f2fd',
    border: '1px solid #90caf9',
    color: '#1565c0',
  },
  busyCapsule: {
    backgroundColor: '#fff3e0',
    border: '1px solid #ffb74d',
    color: '#e65100',
  },
  selectedCapsule: {
    boxShadow: 'inset 0 0 0 2px #333',
  },
  capsuleContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  durationBadge: {
    marginLeft: 'auto',
    paddingLeft: 8,
    fontWeight: 500,
    opacity: 0.7,
    flexShrink: 0,
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
  floatingTooltip: {
    position: 'absolute',
    top: 8,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(33, 33, 33, 0.95)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: 4,
    fontSize: 12,
    maxWidth: '90%',
    wordWrap: 'break-word',
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  collapsedGroup: {
    position: 'absolute',
    height: CAPSULE_HEIGHT - 4,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    cursor: 'pointer',
    backgroundColor: 'rgba(245, 245, 245, 0.9)',
    transition: 'all 0.15s ease',
  },
  collapsedLane: {
    border: '1px solid #90caf9',
    color: '#1565c0',
  },
  collapsedBusy: {
    border: '1px solid #ffb74d',
    color: '#e65100',
  },
  accordionStrip: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '0 8px',
    fontSize: 11,
    fontWeight: 600,
  },
  accordionChevron: {
    fontSize: 10,
    opacity: 0.7,
  },
  accordionCount: {
    fontWeight: 700,
  },
  accordionMix: {
    display: 'flex',
    gap: 4,
    marginLeft: 4,
    fontSize: 9,
  },
  mixBusy: {
    color: '#e65100',
  },
  mixLane: {
    color: '#1565c0',
  },
  groupPopover: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: 4,
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1001,
    minWidth: 200,
    maxWidth: 300,
    overflow: 'hidden',
  },
  popoverHeader: {
    padding: '6px 10px',
    fontSize: 10,
    fontWeight: 600,
    color: '#666',
    backgroundColor: '#f9f9f9',
    borderBottom: '1px solid #eee',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  popoverList: {
    padding: 4,
  },
  popoverItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 6px',
    borderRadius: 4,
    fontSize: 11,
  },
  popoverItemBusy: {
    backgroundColor: 'rgba(255, 243, 224, 0.5)',
  },
  popoverItemLane: {
    backgroundColor: 'rgba(227, 242, 253, 0.5)',
  },
  popoverItemDot: {
    fontSize: 8,
    flexShrink: 0,
  },
  popoverItemText: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  popoverItemDuration: {
    fontSize: 9,
    color: '#888',
    flexShrink: 0,
  },
  popoverMore: {
    padding: '4px 6px',
    fontSize: 10,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  expandedContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 2,
    padding: 4,
    marginBottom: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #ddd',
    borderRadius: 6,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    zIndex: 1000,
  },
  miniCapsule: {
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 9,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 80,
    cursor: 'default',
  },
  miniBusy: {
    backgroundColor: '#fff3e0',
    border: '1px solid #ffb74d',
    color: '#e65100',
  },
  miniLane: {
    backgroundColor: '#e3f2fd',
    border: '1px solid #90caf9',
    color: '#1565c0',
  },
  miniText: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  detailsPanel: {
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: 16,
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  detailsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: '1px solid #eee',
  },
  detailsType: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: '4px 8px',
    borderRadius: 4,
  },
  detailsId: {
    fontSize: 13,
    color: '#999',
    fontFamily: 'monospace',
  },
  detailsRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  detailsLabel: {
    fontWeight: 600,
    color: '#555',
    flexShrink: 0,
    minWidth: 80,
  },
  detailsValue: {
    color: '#333',
    wordBreak: 'break-word',
  },
  // Validation panel styles
  validationPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  contractSection: {
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  contractHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    backgroundColor: '#f9f9f9',
    borderBottom: '1px solid #eee',
  },
  contractTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contractValid: {
    fontSize: 12,
    fontWeight: 600,
    color: '#2e7d32',
    backgroundColor: '#e8f5e9',
    padding: '4px 10px',
    borderRadius: 4,
  },
  contractInvalid: {
    fontSize: 12,
    fontWeight: 600,
    color: '#c62828',
    backgroundColor: '#ffebee',
    padding: '4px 10px',
    borderRadius: 4,
  },
  contractBody: {
    padding: 16,
  },
  contractRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
    fontSize: 13,
  },
  contractLabel: {
    fontWeight: 600,
    color: '#666',
    flexShrink: 0,
    minWidth: 80,
  },
  contractValue: {
    color: '#333',
    wordBreak: 'break-word',
  },
  contractValueMono: {
    color: '#333',
    fontFamily: 'monospace',
    fontSize: 12,
    wordBreak: 'break-word',
  },
  errorsSection: {
    backgroundColor: '#fff',
    border: '1px solid #ffcdd2',
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  errorsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    backgroundColor: '#ffebee',
    borderBottom: '1px solid #ffcdd2',
  },
  errorsIcon: {
    fontSize: 16,
  },
  errorsTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#c62828',
  },
  errorsList: {
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  errorItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 12px',
    backgroundColor: '#fff8f8',
    borderRadius: 6,
    border: '1px solid #ffe0e0',
  },
  errorIcon: {
    fontSize: 16,
    flexShrink: 0,
    marginTop: 1,
  },
  errorContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
  },
  errorType: {
    fontSize: 11,
    fontWeight: 600,
    color: '#c62828',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  errorMessage: {
    fontSize: 13,
    color: '#444',
    lineHeight: 1.4,
  },
};
