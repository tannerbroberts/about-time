import React from 'react';

import type { LaneTemplate, Template } from '../../App';

import type { BusyListItem, GapListItem, LineageItem } from './flattenLaneToListItems';
import { useListItemLaneViewState } from './useListItemLaneViewState';

interface ListItemLaneViewProps {
  lane: LaneTemplate;
  allTemplates: Template[];
}

/**
 * Format duration in milliseconds to a human-readable string.
 */
function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Truncate text with ellipsis if it exceeds max length.
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

interface LineageBreadcrumbsProps {
  lineage: LineageItem[];
}

/**
 * Render the lineage breadcrumbs showing the path from root lane to the
 * busy template. Each level is progressively smaller.
 */
function LineageBreadcrumbs({
  lineage,
}: LineageBreadcrumbsProps): React.ReactElement {
  const maxLengths = [30, 25, 20, 15, 12];

  return (
    <div style={styles.lineageContainer}>
      {lineage.map((item, index) => {
        const maxLen = maxLengths[Math.min(index, maxLengths.length - 1)];
        const displayText = truncateText(item.intent, maxLen);
        const fontSize = Math.max(0.65, 0.85 - index * 0.05);

        return (
          <span
            key={item.templateId}
            style={{
              ...styles.lineageItem,
              fontSize: `${fontSize}rem`,
            }}
            title={item.intent}
          >
            {index > 0 && <span style={styles.lineageSeparator}>›</span>}
            {displayText}
          </span>
        );
      })}
    </div>
  );
}

interface BusyItemRowProps {
  item: BusyListItem;
}

/**
 * Render a single busy item row with lineage and task details.
 */
function BusyItemRow({ item }: BusyItemRowProps): React.ReactElement {
  const { template, lineage } = item;

  return (
    <div style={styles.busyItemContainer}>
      <LineageBreadcrumbs lineage={lineage} />
      <div style={styles.busyItemContent}>
        <div style={styles.busyIndicator} />
        <span style={styles.busyIntent}>{template.intent}</span>
        <span style={styles.busyDuration}>
          {formatDuration(template.estimatedDuration)}
        </span>
      </div>
    </div>
  );
}

interface GapRowProps {
  item: GapListItem;
}

/**
 * Render a gap/wait time indicator between busy tasks.
 */
function GapRow({ item }: GapRowProps): React.ReactElement {
  return (
    <div style={styles.gapContainer}>
      <div style={styles.gapLine} />
      <span style={styles.gapLabel}>
        ⏳ Wait {formatDuration(item.duration)}
      </span>
      <div style={styles.gapLine} />
    </div>
  );
}

/**
 * A list-based view of a lane template that recursively flattens all
 * nested segments into a sequential list of busy tasks with gaps.
 * Each busy task shows its lineage (path from root lane) as breadcrumbs.
 */
export function ListItemLaneView({
  lane,
  allTemplates,
}: ListItemLaneViewProps): React.ReactElement {
  const { items } = useListItemLaneViewState(lane, allTemplates);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>{lane.intent}</span>
        <span style={styles.headerDuration}>
          Total: {formatDuration(lane.estimatedDuration)}
        </span>
      </div>
      <div style={styles.listContainer}>
        {items.map((item, index) => {
          if (item.type === 'busy') {
            return (
              <BusyItemRow
                key={`busy-${item.template.id}-${index}`}
                item={item}
              />
            );
          }
          return (
            <GapRow
              key={`gap-${item.absoluteOffset}-${index}`}
              item={item}
            />
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e0e0e0',
  },
  headerTitle: {
    fontWeight: 600,
    fontSize: '1rem',
  },
  headerDuration: {
    color: '#666',
    fontSize: '0.875rem',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  busyItemContainer: {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 16px',
    borderBottom: '1px solid #f0f0f0',
  },
  lineageContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: '4px',
    color: '#888',
  },
  lineageItem: {
    display: 'inline-flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  lineageSeparator: {
    margin: '0 4px',
    color: '#ccc',
  },
  busyItemContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  busyIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#4CAF50',
    flexShrink: 0,
  },
  busyIntent: {
    flex: 1,
    fontWeight: 500,
    fontSize: '0.95rem',
  },
  busyDuration: {
    color: '#666',
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  gapContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 16px',
    backgroundColor: '#fafafa',
  },
  gapLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e0e0e0',
  },
  gapLabel: {
    padding: '2px 12px',
    fontSize: '0.75rem',
    color: '#999',
    whiteSpace: 'nowrap',
  },
};
