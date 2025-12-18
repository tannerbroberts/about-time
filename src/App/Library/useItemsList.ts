import type { Item, CalendarItem } from './types';

const mockItems: Item[] = [
  {
    itemType: 'calendar',
    id: 'item_001',
    intent: 'Make Bacon and Scrambled Eggs',
    authorId: 'user_123',
    version: '0.0.0',
    estimatedDuration: 600000,
    children: [],
  } satisfies CalendarItem,
];

export function useItemsList(): Item[] {
  return mockItems;
}
