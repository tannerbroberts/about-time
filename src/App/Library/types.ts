export type UUID = string;
export type SemVer = string;
export type Timestamp = number;
export type Duration = number;

export type VariableName = string;
export type Quantity = number;
export type StateLedger = Record<VariableName, Quantity>;

export type TemplateId = string;
export type TemplateType = 'lane' | 'busy';

interface BaseTemplate {
  id: TemplateId;
  intent: string;
  authorId: UUID;
  version: SemVer;
  estimatedDuration: Duration;
}

export interface Segment {
  templateId: TemplateId;
  offset: Duration;
}

export interface LaneTemplate extends BaseTemplate {
  templateType: 'lane';
  segments: Segment[];
}

export interface BusyTemplate extends BaseTemplate {
  templateType: 'busy';
  willConsume: StateLedger;
  willProduce: StateLedger;
}

export type Template = LaneTemplate | BusyTemplate;

export type ExecutionId = string;

export type BusyAccountingStatus = 'Pending' | 'Completed' | 'Canceled';

export type DerivedLaneAccountingStatus = | 'Pending'
  | 'InProgress'
  | 'Completed'
  | 'Canceled'
  | 'Partial';
interface BaseSegmentExecution {
  id: ExecutionId;
  templateId: TemplateId;
  userId: UUID;
  scheduledOffset: Duration;
  actualOffset?: Duration;
  actualDuration?: Duration;
}

export interface BusySegmentExecution extends BaseSegmentExecution {
  type: 'Busy';
  accounting: BusyAccountingStatus;
}

export interface LaneSegmentExecution extends BaseSegmentExecution {
  type: 'Lane';
  segments: SegmentExecution[];
}

export type SegmentExecution = BusySegmentExecution | LaneSegmentExecution;

interface BaseRootExecution {
  id: ExecutionId;
  templateId: TemplateId;
  userId: UUID;
  scheduledStartTime: Timestamp;
}

export interface BusyRootExecution extends BaseRootExecution {
  type: 'Busy';
  accounting: BusyAccountingStatus;
}

export interface LaneRootExecution extends BaseRootExecution {
  type: 'Lane';
  segments: SegmentExecution[];
}

export type RootExecution = BusyRootExecution | LaneRootExecution;

export type Execution = RootExecution | SegmentExecution;

export interface Variable {
  name: string;
  type: 'input' | 'output';
  templateIds: string[];
}

export interface LibraryFilters {
  minDuration: number | null;
  maxDuration: number | null;
  inputsQuery: string;
  outputsQuery: string;
  intentQuery: string;
}
