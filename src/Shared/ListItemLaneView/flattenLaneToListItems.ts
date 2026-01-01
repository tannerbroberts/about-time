import type { LaneTemplate, BusyTemplate, Template, Duration } from '../../App';

interface LineageItem {
  intent: string;
  templateId: string;
}

interface BusyListItem {
  type: 'busy';
  template: BusyTemplate;
  lineage: LineageItem[];
  absoluteOffset: Duration;
}

interface GapListItem {
  type: 'gap';
  duration: Duration;
  absoluteOffset: Duration;
}

type ListItem = BusyListItem | GapListItem;

interface FlattenResult {
  items: ListItem[];
}

/**
 * Build a map from template ID to template for fast lookups.
 */
function buildTemplateMap(
  allTemplates: Template[],
): Map<string, Template> {
  const map = new Map<string, Template>();
  for (const t of allTemplates) {
    map.set(t.id, t);
  }
  return map;
}

interface CollectedBusy {
  template: BusyTemplate;
  lineage: LineageItem[];
  absoluteOffset: Duration;
}

/**
 * Recursively collect all busy templates from a lane, tracking lineage.
 */
function collectBusyTemplates(
  lane: LaneTemplate,
  templateMap: Map<string, Template>,
  parentLineage: LineageItem[],
  parentAbsoluteOffset: Duration,
): CollectedBusy[] {
  const result: CollectedBusy[] = [];
  const currentLineage: LineageItem[] = [
    ...parentLineage,
    { intent: lane.intent, templateId: lane.id },
  ];

  for (const segment of lane.segments) {
    const template = templateMap.get(segment.templateId);
    if (!template) continue;

    const absoluteOffset = parentAbsoluteOffset + segment.offset;

    if (template.templateType === 'busy') {
      result.push({
        template: template as BusyTemplate,
        lineage: currentLineage,
        absoluteOffset,
      });
    } else if (template.templateType === 'lane') {
      const nestedBusy = collectBusyTemplates(
        template as LaneTemplate,
        templateMap,
        currentLineage,
        absoluteOffset,
      );
      result.push(...nestedBusy);
    }
  }

  return result;
}

/**
 * Flatten a lane template into a list of busy items and gaps between them.
 * Items are sorted by absolute offset and gaps are inserted where there's
 * waiting time between consecutive busy tasks.
 */
export function flattenLaneToListItems(
  lane: LaneTemplate,
  allTemplates: Template[],
): FlattenResult {
  const templateMap = buildTemplateMap(allTemplates);

  // Collect all busy templates recursively
  const busyItems = collectBusyTemplates(lane, templateMap, [], 0);

  // Sort by absolute offset
  busyItems.sort((a, b) => a.absoluteOffset - b.absoluteOffset);

  // Build the final list with gaps inserted
  const items: ListItem[] = [];
  let currentTime: Duration = 0;

  for (const busy of busyItems) {
    // Check if there's a gap before this busy task
    const gapDuration = busy.absoluteOffset - currentTime;
    if (gapDuration > 0) {
      items.push({
        type: 'gap',
        duration: gapDuration,
        absoluteOffset: currentTime,
      });
    }

    items.push({
      type: 'busy',
      template: busy.template,
      lineage: busy.lineage,
      absoluteOffset: busy.absoluteOffset,
    });

    currentTime = busy.absoluteOffset + busy.template.estimatedDuration;
  }

  // Check for trailing gap if lane extends beyond last busy task
  const trailingGap = lane.estimatedDuration - currentTime;
  if (trailingGap > 0) {
    items.push({
      type: 'gap',
      duration: trailingGap,
      absoluteOffset: currentTime,
    });
  }

  return { items };
}

export type { ListItem, BusyListItem, GapListItem, LineageItem };
