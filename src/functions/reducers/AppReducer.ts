import { cloneDeep } from "lodash";
import {
  getIndexById,
  Item,
  removeChildById,
  removeChildByRelationshipId,
  removeParentById,
  removeParentByRelationshipId,
  hasChildWithId,
  hasChildWithRelationshipId,
  hasParentWithId,
  hasParentWithRelationshipId,
  addChildToItem,
  CheckListChild,
  CheckListItem,
  SubCalendarItem,
  Parent,
  addParentToItem,
  ItemInstance,
  ItemInstanceImpl,
  Variable,
  VariableSummary,
  createInstanceFromCalendarEntry,
  hasChildren,
  getChildren,
  VariableItem,
  VariableDefinition,
  VariableDescription
} from "../utils/item/index";
import { v4 as uuid } from "uuid";

export type AppState = typeof initialState;

// Base calendar entry representing a scheduled item
export interface BaseCalendarEntry {
  readonly id: string;
  readonly itemId: string;
  readonly startTime: number; // Milliseconds from Apple epoch
  readonly instanceId?: string; // Link to ItemInstance
}

export type AppAction =
  | { type: "BATCH"; payload: AppAction[] }
  | {
    type: "CREATE_ITEM";
    payload: { newItem: Item };
  }
  | { type: "DELETE_ITEM_BY_ID"; payload: { id: string | null } }
  | { type: "REMOVE_INSTANCES_BY_ID"; payload: { id: string | null } }
  | { type: "REMOVE_INSTANCE_BY_RELATIONSHIP_ID"; payload: { relationshipId: string | null } }
  | {
    type: "SET_FOCUSED_ITEM_BY_ID";
    payload: { focusedItemId: string | null };
  }
  | {
    type: "SET_FOCUSED_LIST_ITEM_BY_ID";
    payload: { focusedListItemId: string | null };
  }
  | {
    type: "SET_CURRENT_VIEW";
    payload: { currentView: 'execution' | 'accounting' };
  }
  | {
    type: "SET_ITEM_SEARCH_WINDOW_RANGE";
    payload: { min: number; max: number };
  }
  | {
    type: "SET_MILLISECONDS_PER_SEGMENT";
    payload: { millisecondsPerSegment: number };
  }
  | {
    type: "SET_NEW_ITEM_DIALOG_OPEN";
    payload: { newItemDialogOpen: boolean };
  }
  | {
    type: "SET_SCHEDULING_DIALOG_OPEN";
    payload: { schedulingDialogOpen: boolean };
  }
  | {
    type: "SET_DURATION_DIALOG_OPEN";
    payload: { durationDialogOpen: boolean };
  }
  | {
    type: "SET_CHECKLIST_CHILD_DIALOG_OPEN";
    payload: { checkListChildDialogOpen: boolean };
  }
  | {
    type: "SET_PIXELS_PER_SEGMENT";
    payload: { pixelsPerSegment: number };
  }
  | { type: "SET_SIDE_DRAWER_OPEN"; payload: { sideDrawerOpen: boolean } }
  | {
    type: "TOGGLE_ITEM_SHOW_CHILDREN_BY_ID";
    payload: { id: string; showChildren: boolean };
  }
  | {
    type: "UPDATE_ITEMS";
    payload: { updatedItems: Item[] };
  }
  | {
    type: "ADD_CHILD_TO_ITEM";
    payload: { parentId: string; childId: string };
  }
  | {
    type: "ADD_BASE_CALENDAR_ENTRY";
    payload: { entry: BaseCalendarEntry };
  }
  | {
    type: "REMOVE_BASE_CALENDAR_ENTRY";
    payload: { entryId: string };
  }
  | {
    type: "UPDATE_BASE_CALENDAR_ENTRY";
    payload: { entry: BaseCalendarEntry };
  }
  // Instance Management Actions
  | { type: "CREATE_ITEM_INSTANCE"; payload: { instance: ItemInstanceImpl } }
  | { type: "UPDATE_ITEM_INSTANCE"; payload: { instanceId: string; updates: Partial<ItemInstance> } }
  | { type: "MARK_INSTANCE_STARTED"; payload: { instanceId: string; startTime?: number } }
  | { type: "MARK_INSTANCE_COMPLETED"; payload: { instanceId: string; completedAt?: number } }
  | { type: "DELETE_ITEM_INSTANCE"; payload: { instanceId: string } }
  | { type: "CLEANUP_ORPHANED_INSTANCES"; payload: Record<string, never> }
  // Variable Management Actions  
  | { type: "SET_ITEM_VARIABLES"; payload: { itemId: string; variables: Variable[] } }
  | { type: "ADD_ITEM_VARIABLE"; payload: { itemId: string; variable: Variable } }
  | { type: "REMOVE_ITEM_VARIABLE"; payload: { itemId: string; variableIndex: number } }
  | { type: "UPDATE_ITEM_VARIABLE"; payload: { itemId: string; variableIndex: number; variable: Variable } }
  // Caching Actions
  | { type: "INVALIDATE_VARIABLE_CACHE"; payload: { itemId?: string } }
  | { type: "UPDATE_VARIABLE_CACHE"; payload: { itemId: string; summary: VariableSummary } }
  // Relationship-based Summary Actions
  | { type: "UPDATE_RELATIONSHIP_SUMMARY"; payload: { relationshipId: string; summary: VariableSummary } }
  | { type: "CASCADE_VARIABLE_UPDATE"; payload: { itemId: string; updatedVariables: Variable[] } }
  | { type: "REBUILD_RELATIONSHIP_SUMMARIES"; payload: { itemIds: string[] } }
  | { type: "INVALIDATE_RELATIONSHIP_CACHE"; payload: { relationshipIds: string[] } }
  | { type: "SYNC_RELATIONSHIPS_FROM_ITEMS"; payload: Record<string, never> }
  // New Variable System Actions
  | { type: "CREATE_VARIABLE_DEFINITION"; payload: { definition: VariableDefinition } }
  | { type: "UPDATE_VARIABLE_DEFINITION"; payload: { definitionId: string; updates: Partial<VariableDefinition> } }
  | { type: "DELETE_VARIABLE_DEFINITION"; payload: { definitionId: string } }
  | { type: "SET_VARIABLE_DESCRIPTION"; payload: { definitionId: string; description: VariableDescription } }
  | { type: "UPDATE_VARIABLE_DESCRIPTION"; payload: { definitionId: string; description: VariableDescription } }
  | { type: "CREATE_VARIABLE_ITEM"; payload: { variableItem: VariableItem; definitionId: string } }
  | { type: "UPDATE_VARIABLE_ITEM_VALUE"; payload: { itemId: string; value: number } }
  | { type: "BATCH_CREATE_VARIABLE_ITEMS"; payload: { items: Array<{ variableItem: VariableItem; definitionId: string }> } }
  | { type: "MIGRATE_LEGACY_VARIABLES"; payload: { itemId: string } }
  // Enhanced calendar actions
  | { type: "ADD_BASE_CALENDAR_ENTRY_WITH_INSTANCE"; payload: { entry: BaseCalendarEntry; createInstance?: boolean } };

export const DEFAULT_WINDOW_RANGE_SIZE = 4;
export const initialState = {
  millisecondsPerSegment: 100,
  pixelsPerSegment: 30,
  expandSearchItems: false,
  focusedItemId: null as string | null,
  focusedListItemId: null as string | null,
  currentView: 'execution' as 'execution' | 'accounting',
  items: new Array<Item>(),
  baseCalendar: new Map<string, BaseCalendarEntry>(),
  itemInstances: new Map<string, ItemInstanceImpl>(),
  // Legacy variable system (maintained for backward compatibility during migration)
  itemVariables: new Map<string, Variable[]>(),
  variableSummaryCache: new Map<string, VariableSummary>(),
  // New variable system
  variableDefinitions: new Map<string, VariableDefinition>(),
  variableDescriptions: new Map<string, VariableDescription>(),
  itemSearchWindowRange: { min: 0, max: DEFAULT_WINDOW_RANGE_SIZE },
  schedulingDialogOpen: false,
  durationDialogOpen: false,
  checkListChildDialogOpen: false,
  sideDrawerOpen: false,
  newItemDialogOpen: false,
};

export default function reducer(
  previous: AppState,
  action: AppAction,
): AppState {
  switch (action.type) {
    case "BATCH": {
      //* ****************************************************
      //* Everything
      //* ****************************************************
      const newState = cloneDeep(action.payload.reduce(reducer, previous));
      return newState;
    }
    case "CREATE_ITEM": {
      const { newItem } = action.payload;
      if (!newItem) throw new Error("No new item provided to CREATE_ITEM");

      // Add the new item to the list
      //* ****************************************************
      //* items
      //* ****************************************************
      const newItems = [...previous.items, newItem];

      // Sort by id
      newItems.sort((a, b) => a.id > b.id ? 1 : -1);

      //* ****************************************************
      //* appState
      //* ****************************************************
      return { ...previous, items: newItems };
    }
    case "DELETE_ITEM_BY_ID": {
      const id = action.payload.id;
      if (!id) return previous;

      //* ****************************************************
      //* parents and children with id
      //* ****************************************************
      const removedInstanceState = reducer(previous, {
        type: "REMOVE_INSTANCES_BY_ID",
        payload: { id },
      });

      //* ****************************************************
      //* items
      //* ****************************************************
      const newItems = removedInstanceState.items.filter((item) =>
        item.id !== id
      );

      const { focusedListItemId, focusedItemId } = previous;
      const shouldNullifyFocusedItemId = focusedItemId === id;
      const shouldNullifyFocusedListItemId = focusedListItemId === id;

      //* ****************************************************
      //* appState
      //* ****************************************************
      return {
        ...removedInstanceState,
        items: newItems,
        focusedItemId: shouldNullifyFocusedItemId ? null : focusedItemId,
        focusedListItemId: shouldNullifyFocusedListItemId
          ? null
          : focusedListItemId,
      };
    }
    case "REMOVE_INSTANCES_BY_ID": {
      const id = action.payload.id;
      if (!id) return previous;

      //* ****************************************************
      //* parents and children with id
      //* ****************************************************
      const newItems = previous.items.map((item) => {
        if (hasChildWithId(item, id)) {
          return removeChildById(item, id);
        }
        if (hasParentWithId(item, id)) {
          return removeParentById(item, id);
        }
        return item;
      });

      //* ****************************************************
      //* appState
      //* ****************************************************
      return { ...previous, items: newItems };
    }
    case "REMOVE_INSTANCE_BY_RELATIONSHIP_ID": {
      const relationshipId = action.payload.relationshipId;
      if (!relationshipId) return previous;

      //* ****************************************************
      //* parents and children with relationshipId
      //* ****************************************************
      const newItems = previous.items.map((item) => {
        if (hasChildWithRelationshipId(item, relationshipId)) {
          return removeChildByRelationshipId(item, relationshipId);
        }
        if (hasParentWithRelationshipId(item, relationshipId)) {
          return removeParentByRelationshipId(item, relationshipId);
        }
        return item;
      });

      //* ****************************************************
      //* appState
      //* ****************************************************
      return { ...previous, items: newItems };
    }
    case "SET_FOCUSED_ITEM_BY_ID": {
      const { focusedItemId } = action.payload;

      //* ****************************************************
      //* appState
      //* focusedItemId
      //* ****************************************************
      if (!focusedItemId) return { ...previous, focusedItemId: null, focusedListItemId: null };

      //* ****************************************************
      //* appState
      //* focusedItemId
      //* ****************************************************
      return { ...previous, focusedItemId, focusedListItemId: null };
    }
    case "SET_FOCUSED_LIST_ITEM_BY_ID": {
      const { focusedListItemId } = action.payload;
      if (!focusedListItemId) return previous;

      //* ****************************************************
      //* appState
      //* focusedItemId
      //* ****************************************************
      return { ...previous, focusedListItemId: focusedListItemId };
    }
    case "SET_CURRENT_VIEW": {
      const { currentView } = action.payload;
      //* ****************************************************
      //* appState
      //* currentView
      //* ****************************************************
      return { ...previous, currentView };
    }
    case "SET_SCHEDULING_DIALOG_OPEN": {
      //* ****************************************************
      //* appState
      //* schedulingDialogOpen
      //* ****************************************************
      const { schedulingDialogOpen } = action.payload;
      return { ...previous, schedulingDialogOpen };
    }
    case "SET_DURATION_DIALOG_OPEN": {
      //* ****************************************************
      //* appState
      //* durationDialogOpen
      //* ****************************************************
      const { durationDialogOpen } = action.payload;
      return { ...previous, durationDialogOpen };
    }
    case "SET_CHECKLIST_CHILD_DIALOG_OPEN": {
      //* ****************************************************
      //* appState
      //* checkListChildDialogOpen
      //* ****************************************************
      const { checkListChildDialogOpen } = action.payload;
      return { ...previous, checkListChildDialogOpen };
    }
    case "SET_SIDE_DRAWER_OPEN": {
      //* ****************************************************
      //* appState
      //* sideDrawerOpen
      //* ****************************************************
      const { sideDrawerOpen } = action.payload;
      return { ...previous, sideDrawerOpen };
    }
    case "SET_ITEM_SEARCH_WINDOW_RANGE": {
      const { min, max } = action.payload;
      return { ...previous, itemSearchWindowRange: { min, max } };
    }
    case "SET_MILLISECONDS_PER_SEGMENT": {
      const { millisecondsPerSegment } = action.payload;
      if (millisecondsPerSegment <= 0) {
        throw new Error(
          "millisecondsPerSegment must be greater than 0",
        );
      }
      //* ****************************************************
      //* appState
      //* millisecondsPerSegment
      //* ****************************************************
      return { ...previous, millisecondsPerSegment };
    }
    case "SET_NEW_ITEM_DIALOG_OPEN": {
      //* ****************************************************
      //* appState
      //* newItemDialogOpen
      //* ****************************************************
      const { newItemDialogOpen } = action.payload;
      return { ...previous, newItemDialogOpen };
    }
    case "SET_PIXELS_PER_SEGMENT": {
      const { pixelsPerSegment } = action.payload;
      if (pixelsPerSegment <= 0) {
        throw new Error("pixelsPerSegment must be greater than 0");
      }
      //* ****************************************************
      //* appState
      //* pixelsPerSegment
      //* ****************************************************
      return { ...previous, pixelsPerSegment };
    }
    case "UPDATE_ITEMS": {
      const { updatedItems } = action.payload;
      if (updatedItems.length === 0) return previous;

      updatedItems.forEach((item) => {
        const index = getIndexById(previous.items, item.id);
        if (index === -1) {
          throw new Error("Item not found when trying to update items");
        }
        previous.items[index] = item;
      });
      //* *****************************************************
      //* appState
      //* items
      //* *****************************************************
      return { ...previous, items: [...previous.items] };
    }
    case "ADD_CHILD_TO_ITEM": {
      const { parentId, childId } = action.payload;

      // Find parent and child items
      const parentIndex = getIndexById(previous.items, parentId);
      const childIndex = getIndexById(previous.items, childId);

      if (parentIndex === -1) {
        throw new Error(`Parent item with id ${parentId} not found`);
      }
      if (childIndex === -1) {
        throw new Error(`Child item with id ${childId} not found`);
      }

      const parentItem = previous.items[parentIndex];
      const childItem = previous.items[childIndex];

      // Create the appropriate child relationship
      let updatedParent: Item;
      let updatedChild: Item;

      if (parentItem instanceof CheckListItem) {
        // For CheckListItem, create a CheckListChild
        const checkListChild = new CheckListChild({ itemId: childId });
        updatedParent = addChildToItem(parentItem, checkListChild);

        // Add parent relationship to child
        const parentRelationship = new Parent({
          id: parentId,
          relationshipId: checkListChild.relationshipId
        });
        updatedChild = addParentToItem(childItem, parentRelationship);
      } else if (parentItem instanceof SubCalendarItem) {
        // For SubCalendarItem, this should be handled by DurationDialog/scheduling
        throw new Error("Use DurationDialog for adding children to SubCalendarItem with start times");
      } else {
        throw new Error(`Cannot add children to item of type ${parentItem.constructor.name}`);
      }

      // Update items in state
      const newItems = [...previous.items];
      newItems[parentIndex] = updatedParent;
      newItems[childIndex] = updatedChild;

      //* *****************************************************
      //* appState
      //* items
      //* *****************************************************
      return { ...previous, items: newItems };
    }
    case "ADD_BASE_CALENDAR_ENTRY": {
      // Enhance existing action to create instance
      const { entry } = action.payload;

      // Delegate to new action
      return reducer(previous, {
        type: "ADD_BASE_CALENDAR_ENTRY_WITH_INSTANCE",
        payload: { entry, createInstance: true }
      });
    }
    case "REMOVE_BASE_CALENDAR_ENTRY": {
      const { entryId } = action.payload;
      const entry = previous.baseCalendar.get(entryId);

      // Remove calendar entry
      const newBaseCalendar = new Map(previous.baseCalendar);
      newBaseCalendar.delete(entryId);

      // Remove associated instance if it exists
      let newInstances = previous.itemInstances;
      if (entry?.instanceId) {
        newInstances = new Map(previous.itemInstances);
        newInstances.delete(entry.instanceId);
      }

      return {
        ...previous,
        baseCalendar: newBaseCalendar,
        itemInstances: newInstances
      };
    }
    case "UPDATE_BASE_CALENDAR_ENTRY": {
      const { entry } = action.payload;
      if (!previous.baseCalendar.has(entry.id)) {
        throw new Error(`Base calendar entry with id ${entry.id} not found`);
      }
      const newBaseCalendar = new Map(previous.baseCalendar);
      newBaseCalendar.set(entry.id, entry);

      //* *****************************************************
      //* appState
      //* baseCalendar
      //* *****************************************************
      return { ...previous, baseCalendar: newBaseCalendar };
    }

    // Instance Management Actions
    case "CREATE_ITEM_INSTANCE": {
      const { instance } = action.payload;
      const newInstances = new Map(previous.itemInstances);
      newInstances.set(instance.id, instance);

      return {
        ...previous,
        itemInstances: newInstances
      };
    }

    case "UPDATE_ITEM_INSTANCE": {
      const { instanceId, updates } = action.payload;
      const existingInstance = previous.itemInstances.get(instanceId);

      if (!existingInstance) {
        console.warn(`Instance ${instanceId} not found for update`);
        return previous;
      }

      const updatedInstance = new ItemInstanceImpl({
        ...existingInstance,
        ...updates
      });

      const newInstances = new Map(previous.itemInstances);
      newInstances.set(instanceId, updatedInstance);

      return {
        ...previous,
        itemInstances: newInstances
      };
    }

    case "MARK_INSTANCE_STARTED": {
      const { instanceId, startTime = Date.now() } = action.payload;
      const existingInstance = previous.itemInstances.get(instanceId);

      if (!existingInstance) {
        console.warn(`Instance ${instanceId} not found for start marking`);
        return previous;
      }

      const startedInstance = existingInstance.markStarted(startTime);
      const newInstances = new Map(previous.itemInstances);
      newInstances.set(instanceId, startedInstance);

      return {
        ...previous,
        itemInstances: newInstances
      };
    }

    case "MARK_INSTANCE_COMPLETED": {
      const { instanceId, completedAt = Date.now() } = action.payload;
      const existingInstance = previous.itemInstances.get(instanceId);

      if (!existingInstance) {
        console.warn(`Instance ${instanceId} not found for completion marking`);
        return previous;
      }

      const completedInstance = existingInstance.markCompleted(completedAt);
      const newInstances = new Map(previous.itemInstances);
      newInstances.set(instanceId, completedInstance);

      return {
        ...previous,
        itemInstances: newInstances
      };
    }

    case "DELETE_ITEM_INSTANCE": {
      const { instanceId } = action.payload;
      const newInstances = new Map(previous.itemInstances);
      newInstances.delete(instanceId);

      return {
        ...previous,
        itemInstances: newInstances
      };
    }

    case "CLEANUP_ORPHANED_INSTANCES": {
      // Remove instances that reference non-existent calendar entries or items
      const validItemIds = new Set(previous.items.map(item => item.id));
      const validCalendarEntryIds = new Set(Array.from(previous.baseCalendar.keys()));

      const cleanedInstances = new Map<string, ItemInstanceImpl>();
      for (const [instanceId, instance] of previous.itemInstances) {
        if (validItemIds.has(instance.itemId) && validCalendarEntryIds.has(instance.calendarEntryId)) {
          cleanedInstances.set(instanceId, instance);
        }
      }

      return {
        ...previous,
        itemInstances: cleanedInstances
      };
    }

    // Variable Management Actions
    case "SET_ITEM_VARIABLES": {
      const { itemId, variables } = action.payload;
      const newVariables = new Map(previous.itemVariables);
      newVariables.set(itemId, variables);

      // Invalidate variable cache for affected items
      const newCache = new Map(previous.variableSummaryCache);

      // Remove cache entries for this item and any parent items
      for (const [cachedItemId] of newCache) {
        if (cachedItemId === itemId || itemHasDescendant(previous.items, cachedItemId, itemId)) {
          newCache.delete(cachedItemId);
        }
      }

      return {
        ...previous,
        itemVariables: newVariables,
        variableSummaryCache: newCache
      };
    }

    case "ADD_ITEM_VARIABLE": {
      const { itemId, variable } = action.payload;
      const existingVariables = previous.itemVariables.get(itemId) || [];
      const newVariables = new Map(previous.itemVariables);
      newVariables.set(itemId, [...existingVariables, variable]);

      // Invalidate cache
      const newCache = new Map(previous.variableSummaryCache);
      for (const [cachedItemId] of newCache) {
        if (cachedItemId === itemId || itemHasDescendant(previous.items, cachedItemId, itemId)) {
          newCache.delete(cachedItemId);
        }
      }

      return {
        ...previous,
        itemVariables: newVariables,
        variableSummaryCache: newCache
      };
    }

    case "REMOVE_ITEM_VARIABLE": {
      const { itemId, variableIndex } = action.payload;
      const existingVariables = previous.itemVariables.get(itemId) || [];

      if (variableIndex < 0 || variableIndex >= existingVariables.length) {
        console.warn(`Invalid variable index ${variableIndex} for item ${itemId}`);
        return previous;
      }

      const newVariableArray = existingVariables.filter((_, index) => index !== variableIndex);
      const newVariables = new Map(previous.itemVariables);

      if (newVariableArray.length === 0) {
        newVariables.delete(itemId);
      } else {
        newVariables.set(itemId, newVariableArray);
      }

      // Invalidate cache
      const newCache = new Map(previous.variableSummaryCache);
      for (const [cachedItemId] of newCache) {
        if (cachedItemId === itemId || itemHasDescendant(previous.items, cachedItemId, itemId)) {
          newCache.delete(cachedItemId);
        }
      }

      return {
        ...previous,
        itemVariables: newVariables,
        variableSummaryCache: newCache
      };
    }

    case "UPDATE_ITEM_VARIABLE": {
      const { itemId, variableIndex, variable } = action.payload;
      const existingVariables = previous.itemVariables.get(itemId) || [];

      if (variableIndex < 0 || variableIndex >= existingVariables.length) {
        console.warn(`Invalid variable index ${variableIndex} for item ${itemId}`);
        return previous;
      }

      const newVariableArray = [...existingVariables];
      newVariableArray[variableIndex] = variable;
      const newVariables = new Map(previous.itemVariables);
      newVariables.set(itemId, newVariableArray);

      // Invalidate cache
      const newCache = new Map(previous.variableSummaryCache);
      for (const [cachedItemId] of newCache) {
        if (cachedItemId === itemId || itemHasDescendant(previous.items, cachedItemId, itemId)) {
          newCache.delete(cachedItemId);
        }
      }

      return {
        ...previous,
        itemVariables: newVariables,
        variableSummaryCache: newCache
      };
    }

    case "INVALIDATE_VARIABLE_CACHE": {
      const { itemId } = action.payload;

      if (itemId) {
        // Invalidate cache for specific item and its ancestors
        const newCache = new Map(previous.variableSummaryCache);
        for (const [cachedItemId] of newCache) {
          if (cachedItemId === itemId || itemHasDescendant(previous.items, cachedItemId, itemId)) {
            newCache.delete(cachedItemId);
          }
        }

        return {
          ...previous,
          variableSummaryCache: newCache
        };
      } else {
        // Clear entire cache
        return {
          ...previous,
          variableSummaryCache: new Map()
        };
      }
    }

    case "UPDATE_VARIABLE_CACHE": {
      const { itemId, summary } = action.payload;
      const newCache = new Map(previous.variableSummaryCache);
      newCache.set(itemId, summary);

      return {
        ...previous,
        variableSummaryCache: newCache
      };
    }

    case "ADD_BASE_CALENDAR_ENTRY_WITH_INSTANCE": {
      const { entry, createInstance = true } = action.payload;

      // Add calendar entry
      const newCalendar = new Map(previous.baseCalendar);
      newCalendar.set(entry.id, entry);

      let newInstances = previous.itemInstances;

      // Create instance if requested and not already linked
      if (createInstance && !entry.instanceId) {
        const instance = createInstanceFromCalendarEntry(entry);
        newInstances = new Map(previous.itemInstances);
        newInstances.set(instance.id, instance);

        // Update calendar entry to link to instance
        const updatedEntry = { ...entry, instanceId: instance.id };
        newCalendar.set(entry.id, updatedEntry);
      }

      return {
        ...previous,
        baseCalendar: newCalendar,
        itemInstances: newInstances
      };
    }

    // New Variable System Actions
    case "CREATE_VARIABLE_DEFINITION": {
      const { definition } = action.payload;
      const newDefinitions = new Map(previous.variableDefinitions);
      newDefinitions.set(definition.id, definition);

      return {
        ...previous,
        variableDefinitions: newDefinitions
      };
    }

    case "UPDATE_VARIABLE_DEFINITION": {
      const { definitionId, updates } = action.payload;
      const existingDefinition = previous.variableDefinitions.get(definitionId);

      if (!existingDefinition) {
        console.warn(`Variable definition ${definitionId} not found for update`);
        return previous;
      }

      const updatedDefinition: VariableDefinition = {
        ...existingDefinition,
        ...updates,
        updatedAt: Date.now()
      };

      const newDefinitions = new Map(previous.variableDefinitions);
      newDefinitions.set(definitionId, updatedDefinition);

      return {
        ...previous,
        variableDefinitions: newDefinitions
      };
    }

    case "DELETE_VARIABLE_DEFINITION": {
      const { definitionId } = action.payload;
      const newDefinitions = new Map(previous.variableDefinitions);
      newDefinitions.delete(definitionId);

      // Also remove associated description
      const newDescriptions = new Map(previous.variableDescriptions);
      newDescriptions.delete(definitionId);

      return {
        ...previous,
        variableDefinitions: newDefinitions,
        variableDescriptions: newDescriptions
      };
    }

    case "SET_VARIABLE_DESCRIPTION": {
      const { definitionId, description } = action.payload;
      const newDescriptions = new Map(previous.variableDescriptions);
      newDescriptions.set(definitionId, description);

      return {
        ...previous,
        variableDescriptions: newDescriptions
      };
    }

    case "UPDATE_VARIABLE_DESCRIPTION": {
      const { definitionId, description } = action.payload;

      // Verify the definition exists
      if (!previous.variableDefinitions.has(definitionId)) {
        console.warn(`Variable definition ${definitionId} not found for description update`);
        return previous;
      }

      const newDescriptions = new Map(previous.variableDescriptions);
      newDescriptions.set(definitionId, {
        ...description,
        updatedAt: Date.now()
      });

      return {
        ...previous,
        variableDescriptions: newDescriptions
      };
    }

    case "CREATE_VARIABLE_ITEM": {
      const { variableItem, definitionId } = action.payload;

      // Verify the definition exists
      if (!previous.variableDefinitions.has(definitionId)) {
        console.warn(`Variable definition ${definitionId} not found for new variable item`);
        return previous;
      }

      // Add the variable item to the items array
      const newItems = [...previous.items, variableItem];
      newItems.sort((a, b) => a.id > b.id ? 1 : -1);

      return {
        ...previous,
        items: newItems
      };
    }

    case "UPDATE_VARIABLE_ITEM_VALUE": {
      const { itemId, value } = action.payload;
      const itemIndex = getIndexById(previous.items, itemId);

      if (itemIndex === -1) {
        console.warn(`Variable item ${itemId} not found for value update`);
        return previous;
      }

      const item = previous.items[itemIndex];
      if (!(item instanceof VariableItem)) {
        console.warn(`Item ${itemId} is not a VariableItem`);
        return previous;
      }

      const updatedItem = item.updateValue(value);
      const newItems = [...previous.items];
      newItems[itemIndex] = updatedItem;

      return {
        ...previous,
        items: newItems
      };
    }

    case "BATCH_CREATE_VARIABLE_ITEMS": {
      const { items: variableItemsToCreate } = action.payload;

      // Verify all definitions exist
      for (const { definitionId } of variableItemsToCreate) {
        if (!previous.variableDefinitions.has(definitionId)) {
          console.warn(`Variable definition ${definitionId} not found for batch creation`);
          return previous;
        }
      }

      // Add all variable items to the items array
      const newVariableItems = variableItemsToCreate.map(({ variableItem }) => variableItem);
      const newItems = [...previous.items, ...newVariableItems];
      newItems.sort((a, b) => a.id > b.id ? 1 : -1);

      return {
        ...previous,
        items: newItems
      };
    }

    case "MIGRATE_LEGACY_VARIABLES": {
      const { itemId } = action.payload;

      // This action will be implemented in Step 3 as part of the storage layer migration
      // For now, just return the current state
      console.log(`Legacy variable migration requested for item ${itemId} - to be implemented in Step 3`);
      return previous;
    }

    // Relationship-based Summary Actions
    case "UPDATE_RELATIONSHIP_SUMMARY": {
      // In a more complete implementation, this would update a relationship summary cache
      // For now, we'll just invalidate the variable cache to trigger recalculation
      return {
        ...previous,
        variableSummaryCache: new Map(previous.variableSummaryCache)
      };
    }

    case "CASCADE_VARIABLE_UPDATE": {
      const { itemId } = action.payload;
      // Invalidate cache for this item and all dependent items
      const newCache = new Map(previous.variableSummaryCache);

      // Remove cache entries for affected items
      for (const [cachedItemId] of newCache) {
        if (cachedItemId === itemId || itemHasDescendant(previous.items, cachedItemId, itemId)) {
          newCache.delete(cachedItemId);
        }
      }

      return {
        ...previous,
        variableSummaryCache: newCache
      };
    }

    case "REBUILD_RELATIONSHIP_SUMMARIES": {
      const { itemIds } = action.payload;
      const newCache = new Map(previous.variableSummaryCache);

      // Remove cache entries for specified items
      for (const itemId of itemIds) {
        newCache.delete(itemId);
      }

      return {
        ...previous,
        variableSummaryCache: newCache
      };
    }

    case "INVALIDATE_RELATIONSHIP_CACHE": {
      const { relationshipIds } = action.payload;
      // In a complete implementation, this would map relationshipIds to affected items
      // For now, we'll clear the entire cache to be safe
      console.log('Invalidating relationship cache for relationships:', relationshipIds);

      return {
        ...previous,
        variableSummaryCache: new Map()
      };
    }

    case "SYNC_RELATIONSHIPS_FROM_ITEMS": {
      // This action triggers synchronization of the relationship tracker with current items
      // The actual work is done by the relationship system, not the reducer
      // We just clear the cache to force recalculation with updated relationships
      return {
        ...previous,
        variableSummaryCache: new Map()
      };
    }

    default:
      return previous;
  }
}

// Helper function for cache invalidation
function itemHasDescendant(items: Item[], ancestorId: string, descendantId: string): boolean {
  const ancestor = items.find(item => item.id === ancestorId);
  if (!ancestor || !hasChildren(ancestor)) return false;

  const children = getChildren(ancestor);
  for (const childRef of children) {
    const childId = 'id' in childRef ? childRef.id : childRef.itemId;
    if (childId === descendantId) return true;

    if (itemHasDescendant(items, childId, descendantId)) return true;
  }

  return false;
}

// Utility function to create a base calendar entry
export function createBaseCalendarEntry(itemId: string, startTime: number): BaseCalendarEntry {
  return {
    id: uuid(),
    itemId,
    startTime
  };
}
