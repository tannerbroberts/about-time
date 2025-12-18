/**
 * BEHAVIOR MARKUP LANGUAGE (BML) v1.0
 * Context: Hierarchical, State-Aware Behavioral Tracking
 */

// --- 1. PRIMITIVES ---

export type UUID = string;
export type SemVer = string; // e.g., "1.0.0"
export type Timestamp = number; // Unix Epoch in milliseconds
export type Duration = number; // milliseconds

// The "Currency" of the system.
// Everything is defined by what you have (Inputs) and what you get (Outputs).
// e.g., "dirty_pan": 1, "consumed_calories": 500, "time_spent": 30000
export type VariableName = string;
export type Quantity = number;
export type StateLedger = Record<VariableName, Quantity>;

// --- 2. THE BLUEPRINT (The "Item") ---
// This is the static instruction set. It does not change when an instance that
// references it is executed.

export type ItemId = string; // item_[UUID]
export type ItemType = 'calendar' | 'busy';

// BaseItem: Shared properties for all item types.
// This is type scaffolding only - not a valid standalone item.
interface BaseItem {
  id: ItemId;
  intent: string; // Human-readable goal
  authorId: UUID; // The creator of this protocol
  version: SemVer; // For managing protocol updates
  estimatedDuration: Duration;
}

// CalendarItem: A container for organizing other items hierarchically.
// Cannot have inputs/outputs - only BusyItems can affect system state.
export interface CalendarItem extends BaseItem {
  itemType: 'calendar';

  // Composition: How this Item is built from smaller Items.
  children: RelativeInstance[];
}

// BusyItem: An atomic action that affects system state via inputs/outputs.
// Only BusyItems can have variables - this ensures state changes happen
// at the atomic action level, with completion as the update mechanism.
export interface BusyItem extends BaseItem {
  itemType: 'busy';

  willConsume: StateLedger;
  willProduce: StateLedger;
}

// Union type for all Item variants
export type Item = CalendarItem | BusyItem;

// --- 3. THE REALITY (The "Instance") ---
// This is the dynamic recording of an execution that either has happened, is happening, or will happen.
// Collections of instances capture the drift between "Plan" and "Reality" implicitly via their status and timing data.

export type InstanceId = string; // instance_[UUID]
export type ExecutionStatus = 'Scheduled' | 'InProgress' | 'Success' | 'Failure' | 'Skipped';

// Base properties common to all Instances
interface BaseInstance {
  id: InstanceId;
  itemId: ItemId; // The Blueprint being attempted
  userId: UUID; // The Agent/Human executing it

  status: ExecutionStatus;
  // State changes tracked via instance completion, not stored directly.
  // Multiple instances of same VariableName aggregate their inputs/outputs on success.
}

// A Top-Level Event (e.g., The root entry scheduled by the user)
// Anchored to a specific point in real time.
export interface AbsoluteInstance extends BaseInstance {
  type: 'Absolute';

  // Timing
  scheduledStartTime: Timestamp;
  actualStartTime?: Timestamp;
  actualEndTime?: Timestamp;

  // The Recursive Log
  children: RelativeInstance[]; // Cannot contain AbsoluteInstances, only one root per Item tree
}

// A Child Event (e.g., "Crack Egg" inside "Make Breakfast")
// Anchored relative to its parent.
export interface RelativeInstance extends BaseInstance {
  type: 'Relative';
  parentInstanceId: InstanceId;

  // Timing
  scheduledOffset: Duration; // From the Item definition
  actualOffset?: Duration; // When it actually happened
  actualDuration?: Duration;

  // Recursive children for deep nesting
  children: RelativeInstance[]; // Cannot contain AbsoluteInstances, only one root per Item tree
}
