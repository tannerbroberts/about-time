// Add actions
// Edit actions
// Layout actions
// Navigate actions
export type ActionId = 'select-existing'
  | 'create-busy'
  | 'create-lane'
  | 'duplicate'
  | 'adjust-offset'
  | 'remove-segment'
  | 'pack-tightly'
  | 'distribute-evenly'
  | 'fit-to-content'
  | 'add-gap'
  | 'focus-parent'
  | 'focus-segment'
  | 'change-base-template';

export type CategoryId = 'add' | 'edit' | 'layout' | 'navigate';

export interface MenuCategory {
  id: CategoryId;
  label: string;
  icon?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  description?: string;
  isEnabled: boolean;
  disabledTooltip?: string;
  onExecute: () => void;
}

export interface MenuBranch {
  id: string;
  label: string;
  children: Array<MenuItem | MenuBranch>;
}

export interface Position {
  x: number;
  y: number;
}

export interface ActionBranchProps {
  parentPosition: Position;
  parentAngle: number;
  onNavigate: (path: string[]) => void;
}
