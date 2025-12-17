import type { Item } from './types';

const mockItems: Item[] = [
  {
    id: 'item_001',
    intent: 'Make Scrambled Eggs',
    authorId: 'user_123',
    version: '1.0.0',
    inputs: { eggs: 2, butter: 1 },
    outputs: { scrambled_eggs: 1, dirty_pan: 1 },
    estimatedDuration: 600000,
    children: [],
  },
  {
    id: 'item_002',
    intent: 'Brew Morning Coffee',
    authorId: 'user_123',
    version: '1.2.0',
    inputs: { coffee_beans: 20, water: 300 },
    outputs: { brewed_coffee: 1 },
    estimatedDuration: 300000,
    children: [],
  },
  {
    id: 'item_003',
    intent: 'Complete Daily Workout',
    authorId: 'user_456',
    version: '2.0.0',
    inputs: { energy: 100 },
    outputs: { fitness_points: 50, calories_burned: 300 },
    estimatedDuration: 2700000,
    children: [],
  },
];

export function useItemsList(): Item[] {
  return mockItems;
}
