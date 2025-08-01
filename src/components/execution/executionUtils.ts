import {
  Item,
  SubCalendarItem,
  CheckListItem,
  Child,
  CheckListChild,
  ItemInstance,
  ItemInstanceImpl,
  getCurrentTaskChain
} from "../../functions/utils/item/index";
import { getItemById } from "../../functions/utils/item/utils";
import type { BaseCalendarEntry } from "../../functions/reducers/AppReducer";

/**
 * Enhanced child execution status with countdown information
 */
export interface ChildExecutionStatus {
  activeChild: Item | null;
  nextChild: {
    item: Item;
    timeUntilStart: number;
    startTime: number;
  } | null;
  gapPeriod: boolean;
  currentPhase: 'pre-start' | 'active' | 'gap' | 'complete';
}

/**
 * Enhanced execution context that includes instance information
 */
export interface ExecutionContextWithInstances {
  currentItem: Item | null;
  currentInstance: ItemInstance | null;
  taskChain: Array<{ item: Item; instance: ItemInstance | null }>;
  baseStartTime: number;
  actualStartTime?: number;
}

/**
 * Get execution context including instance information
 */
export function getExecutionContext(
  items: Item[],
  instances: Map<string, ItemInstance>,
  baseCalendar: Map<string, BaseCalendarEntry>,
  currentTime: number = Date.now()
): ExecutionContextWithInstances {
  // Get the current task chain using existing logic
  const taskChain = getCurrentTaskChain(items, currentTime, baseCalendar);

  if (taskChain.length === 0) {
    return {
      currentItem: null,
      currentInstance: null,
      taskChain: [],
      baseStartTime: currentTime
    };
  }

  // Find base calendar entry for root item
  const rootItem = taskChain[0];
  let baseCalendarEntry: BaseCalendarEntry | null = null;

  for (const [, entry] of baseCalendar) {
    if (entry.itemId === rootItem.id) {
      baseCalendarEntry = entry;
      break;
    }
  }

  if (!baseCalendarEntry) {
    console.warn('No base calendar entry found for root item:', rootItem.id);
    return {
      currentItem: taskChain[taskChain.length - 1],
      currentInstance: null,
      taskChain: taskChain.map((item: Item) => ({ item, instance: null })),
      baseStartTime: currentTime
    };
  }

  // Get or create instance for base calendar entry
  const rootInstance = instances.get(baseCalendarEntry.instanceId || '');

  if (!rootInstance && baseCalendarEntry.instanceId) {
    console.warn('Instance not found for calendar entry:', baseCalendarEntry.instanceId);
  }

  // Build task chain with instances
  const taskChainWithInstances = taskChain.map((item: Item) => {
    if (item.id === rootItem.id) {
      return { item, instance: rootInstance || null };
    } else {
      // For child items, instances are created when they start executing
      // Look for existing instance or create placeholder
      const childInstances = Array.from(instances.values()).filter(
        inst => inst.itemId === item.id && inst.calendarEntryId === baseCalendarEntry.id
      );

      return {
        item,
        instance: childInstances.length > 0 ? childInstances[0] : null
      };
    }
  });

  const currentItem = taskChain[taskChain.length - 1];
  const currentInstance = taskChainWithInstances[taskChainWithInstances.length - 1]?.instance || null;

  return {
    currentItem,
    currentInstance,
    taskChain: taskChainWithInstances,
    baseStartTime: baseCalendarEntry.startTime,
    actualStartTime: rootInstance?.actualStartTime
  };
}

/**
 * Start tracking execution for a checklist item
 */
export function startChecklistItemExecution(
  item: CheckListItem,
  parentInstance: ItemInstance,
  startTime: number = Date.now()
): ItemInstance {
  // Update parent instance with checklist start time
  const updatedExecutionDetails = {
    ...parentInstance.executionDetails,
    checklistStartTimes: {
      ...parentInstance.executionDetails.checklistStartTimes,
      [item.id]: startTime
    }
  };

  return new ItemInstanceImpl({
    ...parentInstance,
    executionDetails: updatedExecutionDetails
  });
}

/**
 * Check if a checklist item has started based on parent instance
 */
export function hasChecklistItemStarted(
  item: CheckListItem,
  parentInstance: ItemInstance | null
): boolean {
  if (!parentInstance) return false;

  return Boolean(parentInstance.executionDetails.checklistStartTimes?.[item.id]);
}

/**
 * Get start time for a checklist item from parent instance
 */
export function getChecklistItemStartTime(
  item: CheckListItem,
  parentInstance: ItemInstance | null,
  fallbackTime: number
): number {
  if (!parentInstance) return fallbackTime;

  return parentInstance.executionDetails.checklistStartTimes?.[item.id] || fallbackTime;
}

/**
 * Calculate start time for a child item based on parent context
 */
export function calculateChildStartTime(
  parentStartTime: number,
  childReference: Child | CheckListChild
): number {
  // For CheckListItem children, they use the same start time as parent
  if ('complete' in childReference) {
    // This is a CheckListChild
    return parentStartTime;
  }

  // For SubCalendarItem children, add the child's start offset to parent start time
  return parentStartTime + childReference.start;
}

/**
 * Helper function to find item by id with linear search (for unsorted arrays)
 */
function findItemById(items: Item[], id: string): Item | null {
  return items.find(item => item.id === id) || null;
}

/**
 * Enhanced version of getActiveChildForExecution with countdown information
 */
export function getChildExecutionStatus(
  parentItem: SubCalendarItem | CheckListItem,
  items: Item[],
  currentTime: number,
  parentStartTime: number
): ChildExecutionStatus {
  if (parentItem instanceof SubCalendarItem) {
    return getSubCalendarExecutionStatus(parentItem, items, currentTime, parentStartTime);
  } else if (parentItem instanceof CheckListItem) {
    return getCheckListExecutionStatus(parentItem, items);
  }

  return {
    activeChild: null,
    nextChild: null,
    gapPeriod: false,
    currentPhase: 'complete'
  };
}

/**
 * Get enhanced execution status for SubCalendarItem
 */
function getSubCalendarExecutionStatus(
  parentItem: SubCalendarItem,
  items: Item[],
  currentTime: number,
  parentStartTime: number
): ChildExecutionStatus {
  if (parentItem.children.length === 0) {
    return {
      activeChild: null,
      nextChild: null,
      gapPeriod: false,
      currentPhase: 'complete'
    };
  }

  const elapsedTime = currentTime - parentStartTime;
  const sortedChildren = [...parentItem.children].sort((a, b) => a.start - b.start);

  // If we haven't started yet, find the first child
  if (elapsedTime < 0) {
    const firstChild = sortedChildren[0];
    const childItem = findItemById(items, firstChild.id);

    if (childItem) {
      return {
        activeChild: null,
        nextChild: {
          item: childItem,
          timeUntilStart: Math.abs(elapsedTime) + firstChild.start,
          startTime: parentStartTime + firstChild.start
        },
        gapPeriod: false,
        currentPhase: 'pre-start'
      };
    }
  }

  // Find currently active child or determine gap period
  for (let i = 0; i < sortedChildren.length; i++) {
    const child = sortedChildren[i];
    // Use linear search instead of getItemById for reliability
    const childItem = findItemById(items, child.id);

    if (!childItem) continue;

    const childStartTime = child.start;
    const childEndTime = child.start + childItem.duration;

    // Check if this child is currently active
    if (elapsedTime >= childStartTime && elapsedTime < childEndTime) {
      return {
        activeChild: childItem,
        nextChild: getNextChildInfo(sortedChildren, items, i + 1, parentStartTime),
        gapPeriod: false,
        currentPhase: 'active'
      };
    }

    // Check if we're in a gap before this child
    if (elapsedTime < childStartTime) {
      return {
        activeChild: null,
        nextChild: {
          item: childItem,
          timeUntilStart: childStartTime - elapsedTime,
          startTime: parentStartTime + childStartTime
        },
        gapPeriod: true,
        currentPhase: 'gap'
      };
    }
  }

  // We're past all children
  return {
    activeChild: null,
    nextChild: null,
    gapPeriod: false,
    currentPhase: 'complete'
  };
}

/**
 * Get enhanced execution status for CheckListItem
 */
function getCheckListExecutionStatus(
  parentItem: CheckListItem,
  items: Item[]
): ChildExecutionStatus {
  if (parentItem.children.length === 0) {
    return {
      activeChild: null,
      nextChild: null,
      gapPeriod: false,
      currentPhase: 'complete'
    };
  }

  // Find the first incomplete child
  for (let i = 0; i < parentItem.children.length; i++) {
    const child = parentItem.children[i];
    if (!child.complete) {
      const childItem = findItemById(items, child.itemId);
      if (childItem) {
        // Find next child for context
        const nextChildInfo = getNextCheckListChildInfo(parentItem.children, items, i + 1);

        return {
          activeChild: childItem,
          nextChild: nextChildInfo,
          gapPeriod: false,
          currentPhase: 'active'
        };
      }
    }
  }

  // All children are complete
  return {
    activeChild: null,
    nextChild: null,
    gapPeriod: false,
    currentPhase: 'complete'
  };
}

/**
 * Get next child information for SubCalendar
 */
function getNextChildInfo(
  sortedChildren: Child[],
  items: Item[],
  startIndex: number,
  parentStartTime: number
): { item: Item; timeUntilStart: number; startTime: number } | null {
  for (let i = startIndex; i < sortedChildren.length; i++) {
    const child = sortedChildren[i];
    const childItem = findItemById(items, child.id);

    if (childItem) {
      return {
        item: childItem,
        timeUntilStart: 0, // Will be calculated in real-time
        startTime: parentStartTime + child.start
      };
    }
  }

  return null;
}

/**
 * Get next child information for CheckList
 */
function getNextCheckListChildInfo(
  children: CheckListChild[],
  items: Item[],
  startIndex: number
): { item: Item; timeUntilStart: number; startTime: number } | null {
  for (let i = startIndex; i < children.length; i++) {
    const child = children[i];
    if (!child.complete) {
      const childItem = findItemById(items, child.itemId);
      if (childItem) {
        return {
          item: childItem,
          timeUntilStart: 0, // CheckList items don't have time-based transitions
          startTime: 0
        };
      }
    }
  }

  return null;
}

/**
 * Determine if we're in a gap period between children
 */
export function isInGapPeriod(
  parentItem: SubCalendarItem,
  items: Item[],
  currentTime: number,
  parentStartTime: number
): boolean {
  const status = getChildExecutionStatus(parentItem, items, currentTime, parentStartTime);
  return status.gapPeriod;
}

/**
 * Get context message for gap periods
 */
export function getGapPeriodContext(
  nextChild: { item: Item; timeUntilStart: number; startTime: number } | null,
  currentPhase: string
): string {
  if (!nextChild) {
    return 'All tasks complete';
  }

  if (currentPhase === 'pre-start') {
    return `Preparing to start: ${nextChild.item.name}`;
  }

  if (currentPhase === 'gap') {
    const minutes = Math.floor(nextChild.timeUntilStart / (60 * 1000));
    const seconds = Math.floor((nextChild.timeUntilStart % (60 * 1000)) / 1000);

    if (minutes > 0) {
      return `Next: ${nextChild.item.name} in ${minutes}m ${seconds}s`;
    } else {
      return `Next: ${nextChild.item.name} in ${seconds}s`;
    }
  }

  return `Next: ${nextChild.item.name}`;
}

/**
 * Get the active child item for current time in execution context
 */
export function getActiveChildForExecution(
  parentItem: SubCalendarItem | CheckListItem,
  items: Item[],
  currentTime: number,
  parentStartTime: number
): Item | null {
  if (parentItem instanceof SubCalendarItem) {
    return getActiveSubCalendarChild(parentItem, items, currentTime, parentStartTime);
  } else if (parentItem instanceof CheckListItem) {
    return getActiveCheckListChild(parentItem, items);
  }

  return null;
}

/**
 * Get active child for SubCalendarItem based on current time
 */
function getActiveSubCalendarChild(
  parentItem: SubCalendarItem,
  items: Item[],
  currentTime: number,
  parentStartTime: number
): Item | null {
  if (parentItem.children.length === 0) return null;

  const elapsedTime = currentTime - parentStartTime;
  const sortedChildren = [...parentItem.children].sort((a, b) => a.start - b.start);

  // If we haven't started yet, return null
  if (elapsedTime < 0) return null;

  // Find the child that should be active at the current time
  for (const child of sortedChildren) {
    const childItem = getItemById(items, child.id);
    if (!childItem) continue;

    // Check if we're within this child's execution window
    if (elapsedTime >= child.start && elapsedTime < child.start + childItem.duration) {
      return childItem;
    }
  }

  // If no child is currently active, return null
  return null;
}

/**
 * Get active child for CheckListItem (next incomplete or currently executing)
 */
function getActiveCheckListChild(
  parentItem: CheckListItem,
  items: Item[]
): Item | null {
  if (parentItem.children.length === 0) return null;

  // Find the first incomplete child
  for (const child of parentItem.children) {
    if (!child.complete) {
      const childItem = getItemById(items, child.itemId);
      if (childItem) return childItem;
    }
  }

  // If all children are complete, return the last one
  const lastChild = parentItem.children[parentItem.children.length - 1];
  return getItemById(items, lastChild.itemId);
}

/**
 * Determine if item should show as actively executing
 * In the context of the display router, an item is executing if it's the deepest item
 */
export function isItemCurrentlyExecuting(
  item: Item,
  taskChain: Item[]
): boolean {
  // Find the item in the task chain
  const itemIndex = taskChain.findIndex(chainItem => chainItem.id === item.id);
  if (itemIndex === -1) return false;

  // If it's the deepest item in chain, it's actively executing
  return itemIndex === taskChain.length - 1;
}

/**
 * Validate that recursion depth doesn't exceed maximum to prevent infinite loops
 */
export function isRecursionDepthValid(depth: number, maxDepth: number = 10): boolean {
  return depth < maxDepth;
}

/**
 * Get the display depth for an item based on its position in task chain
 */
export function getDisplayDepth(item: Item, taskChain: Item[]): number {
  const index = taskChain.findIndex(chainItem => chainItem.id === item.id);
  return index >= 0 ? index : 0;
}
