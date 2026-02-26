export const NOTIFICATION_MESSAGES = {
  TEMPLATE_DUPLICATED: (name: string): string => `Template duplicated: "${name}"`,
  TEMPLATE_CREATED: (name: string): string => `Template created: "${name}"`,
  TEMPLATE_DELETED: (name: string): string => `Template deleted: "${name}"`,
  SEGMENT_ADDED: 'Segment added to template',
  SEGMENT_DELETED: 'Segment removed',
  LAYOUT_PACK_TIGHTLY: 'Layout applied: Pack Tightly',
  LAYOUT_DISTRIBUTE_EVENLY: 'Layout applied: Distribute Evenly',
  LAYOUT_FIT_TO_CONTENT: 'Layout applied: Fit to Content',
  LAYOUT_ADD_GAP: (gapMs: number): string => `Layout applied: Add Gap (${gapMs}ms)`,
} as const;

export const NOTIFICATION_DURATIONS = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 7000,
} as const;
